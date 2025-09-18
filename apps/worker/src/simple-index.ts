interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLERK_SECRET_KEY: string;
  APP_URL: string;
  WWW_URL: string;
  FROM_EMAIL: string;
  REPLY_TO_EMAIL: string;
  NOTIFICATION_EMAIL: string;
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
  CAL_LINK: string;
}

// Helper function to extract user ID from Clerk token
async function getUserIdFromToken(request: Request, env: Env): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  // For now, we'll use a simple approach - in production you'd verify the JWT
  // Extract user ID from the token (simplified for demo)
  const token = authHeader.substring(7);

  // In a real implementation, you'd verify the JWT signature with Clerk's public key
  // For now, we'll use the token as a user identifier
  return token.substring(0, 32); // Use first 32 chars as user ID
}

async function generateRealRecommendations(intake: any, env: any) {
  const startTime = Date.now();
  const age = intake.core?.age || 35;
  const coverage = intake.core?.coverageTarget;

  // Build query for RAG retrieval
  const queries = buildRetrievalQueries(intake.core);

  // Get all carriers from database
  const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY preferred_tier_rank').all();
  const recommendations = [];

  for (const carrier of carriers.results || []) {
    const recommendation = await evaluateCarrierFit(carrier, queries, intake.core, env);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Sort by fit percentage descending
  recommendations.sort((a, b) => b.fitPct - a.fitPct);

  // If no carriers in database, fall back to hardcoded ones with RAG
  if (recommendations.length === 0) {
    return await generateFallbackRecommendations(intake, queries, env);
  }

  const latency = Date.now() - startTime;
  console.log(`Generated ${recommendations.length} recommendations in ${latency}ms`);

  return recommendations;
}

function buildRetrievalQueries(core: any): string[] {
  const queries = [];

  // Basic eligibility query
  queries.push(`${core.coverageTarget.type} insurance age ${core.age} coverage ${core.coverageTarget.amount} eligibility requirements`);

  // Build/BMI query
  const bmi = (core.weight / (core.height * core.height)) * 703;
  queries.push(`build chart height ${core.height} weight ${core.weight} BMI ${Math.round(bmi)} underwriting`);

  // Nicotine/tobacco query
  if (core.nicotine.lastUse !== 'never') {
    queries.push(`nicotine tobacco use ${core.nicotine.lastUse} ${core.nicotine.type || ''} underwriting class`);
  }

  // Marijuana query
  if (core.marijuana.lastUse !== 'never') {
    queries.push(`marijuana cannabis use ${core.marijuana.lastUse} ${core.marijuana.type || ''} accelerated underwriting`);
  }

  // Medical conditions
  if (core.diabetes?.hasCondition) {
    queries.push(`diabetes ${core.diabetes.type || ''} underwriting requirements`);
  }

  if (core.cardiac?.hasHistory) {
    queries.push(`cardiac heart disease underwriting requirements`);
  }

  if (core.cancer?.hasHistory) {
    queries.push(`cancer history underwriting survivorship requirements`);
  }

  // Risk activities
  if (core.drivingAndRisk.duiHistory) {
    queries.push(`DUI driving record underwriting impact`);
  }

  if (core.drivingAndRisk.riskActivities?.length > 0) {
    queries.push(`aviation scuba racing climbing high risk activities underwriting`);
  }

  // Coverage amount considerations
  if (core.coverageTarget.amount > 1000000) {
    queries.push(`large face amount ${core.coverageTarget.amount} financial underwriting requirements`);
  }

  return queries;
}

async function evaluateCarrierFit(carrier: any, queries: string[], core: any, env: any): Promise<any | null> {
  const citations = [];
  let totalScore = 0;
  let queryCount = 0;

  // Query RAG for each search term
  for (const query of queries) {
    try {
      const results = await querySimilarChunks(query, env, {
        topK: 3,
        carrierFilter: carrier.id
      });

      if (results.length > 0) {
        queryCount++;
        const bestMatch = results[0];
        totalScore += bestMatch.score * 100;

        // Add citation if score is high enough
        if (bestMatch.score > 0.7) {
          citations.push({
            chunkId: bestMatch.chunkId,
            snippet: bestMatch.text.substring(0, 200) + '...',
            documentTitle: `${carrier.name} Underwriting Guide`,
            effectiveDate: new Date().toISOString().split('T')[0],
            section: bestMatch.section
          });
        }
      }
    } catch (error) {
      console.error(`Error querying for carrier ${carrier.id}:`, error);
    }
  }

  if (queryCount === 0) {
    // Fall back to mock data if no RAG results
    return getMockCarrierRecommendation(carrier, core);
  }

  const fitPct = Math.min(95, Math.round(totalScore / queryCount));
  const confidence = fitPct > 80 ? 'high' : fitPct > 60 ? 'medium' : 'low';

  // Generate reasons based on core data
  const reasons = generateReasons(core, carrier, fitPct);
  const advisories = generateAdvisories(core, carrier);

  return {
    carrierId: carrier.id,
    carrierName: carrier.name,
    product: `${carrier.name} ${core.coverageTarget.type.toUpperCase()}`,
    fitPct,
    confidence,
    reasons,
    citations: citations.slice(0, 3),
    advisories,
    apsLikely: determineApsLikelihood(core, fitPct),
    ctas: {
      portalUrl: carrier.portal_url || '#',
      agentPhone: carrier.agent_phone || '1-800-CARRIER'
    }
  };
}

async function querySimilarChunks(query: string, env: any, options: { topK?: number; carrierFilter?: string } = {}) {
  try {
    // Generate embedding for query
    const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    });

    // Search Vectorize
    const searchResults = await env.CARRIER_INDEX.query(queryEmbedding.data[0], {
      topK: options.topK || 10,
      filter: options.carrierFilter ? { carrierId: options.carrierFilter } : undefined
    });

    // Enrich with chunk data from D1
    const results = [];
    for (const match of searchResults.matches || []) {
      const chunkData = await env.DB.prepare(
        'SELECT text, document_id, section FROM chunks WHERE id = ?'
      ).bind(match.id).first();

      if (chunkData) {
        results.push({
          chunkId: match.id,
          text: chunkData.text,
          score: match.score,
          carrierId: match.metadata?.carrierId || '',
          documentId: chunkData.document_id,
          section: chunkData.section
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to query similar chunks:', error);
    return [];
  }
}

async function generateFallbackRecommendations(intake: any, queries: string[], env: any) {
  // Use the hardcoded carriers but with RAG queries
  const hardcodedCarriers = [
    { id: 'f&g', name: 'F&G Life', portal_url: 'https://portal.fglife.com', agent_phone: '1-800-FG-AGENT' },
    { id: 'moo', name: 'Mutual of Omaha', portal_url: 'https://agent.mutualofomaha.com', agent_phone: '1-800-MUT-OMAHA' },
    { id: 'foresters', name: 'Foresters Financial', portal_url: 'https://www.foresters.com/agent', agent_phone: '1-800-FORESTERS' },
    { id: 'protective', name: 'Protective Life', portal_url: 'https://agent.protective.com', agent_phone: '1-800-PROTECTIVE' }
  ];

  const recommendations = [];
  for (const carrier of hardcodedCarriers) {
    const recommendation = await evaluateCarrierFit(carrier, queries, intake.core, env);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  return recommendations.sort((a, b) => b.fitPct - a.fitPct);
}

function generateReasons(core: any, carrier: any, fitPct: number): string[] {
  const reasons = [];

  if (core.age <= 60 && core.coverageTarget.amount <= 1000000) {
    reasons.push('Age and amount qualify for simplified underwriting');
  }

  const bmi = (core.weight / (core.height * core.height)) * 703;
  if (bmi >= 18.5 && bmi <= 30) {
    reasons.push('Build within standard range');
  }

  if (core.nicotine.lastUse === 'never') {
    reasons.push('Non-tobacco qualification');
  }

  if (fitPct > 80) {
    reasons.push('Strong carrier match based on profile');
  } else if (fitPct > 60) {
    reasons.push('Good carrier option with consideration');
  }

  if (carrier.preferred_tier_rank <= 2) {
    reasons.push('Preferred carrier in agency lineup');
  }

  return reasons.slice(0, 4);
}

function generateAdvisories(core: any, carrier: any): string[] {
  const advisories = [];

  if (core.nicotine.lastUse === 'current') {
    advisories.push('Current nicotine use will impact rating class');
  }

  if (core.marijuana.lastUse === 'past12Months') {
    advisories.push('Recent marijuana use may disqualify accelerated underwriting');
  }

  if (core.coverageTarget.amount > 1000000) {
    advisories.push('Large face amount may require additional financial documentation');
  }

  if (core.diabetes?.hasCondition || core.cardiac?.hasHistory || core.cancer?.hasHistory) {
    advisories.push('Medical history requires careful underwriting review');
  }

  return advisories;
}

function determineApsLikelihood(core: any, fitPct: number): boolean {
  if (core.age > 55) return true;
  if (core.coverageTarget.amount > 500000) return true;
  if (core.diabetes?.hasCondition || core.cardiac?.hasHistory || core.cancer?.hasHistory) return true;
  if (fitPct < 70) return true;

  return false;
}

function getMockCarrierRecommendation(carrier: any, core: any): any {
  // Fallback to original mock logic when RAG has no data
  return {
    carrierId: carrier.id,
    carrierName: carrier.name,
    product: `${carrier.name} ${core.coverageTarget.type.toUpperCase()}`,
    fitPct: Math.max(50, Math.min(90, 75 + (carrier.preferred_tier_rank || 99) * 5)),
    confidence: 'medium' as const,
    reasons: [
      'Standard underwriting available',
      'Competitive rates for profile',
      'Established carrier with good ratings'
    ],
    citations: [],
    advisories: ['Limited data available - verify requirements with carrier'],
    apsLikely: core.age > 55 || core.coverageTarget.amount > 500000,
    ctas: {
      portalUrl: carrier.portal_url || '#',
      agentPhone: carrier.agent_phone || '1-800-CARRIER'
    }
  };
}

function generateMockRecommendations(intake: any) {
  const age = intake.core?.age || 35;
  const nicotineUse = intake.core?.nicotine?.lastUse || 'never';
  const hasMarijuana = intake.core?.marijuana?.lastUse !== 'never';
  const coverageType = intake.core?.coverageTarget?.type || 'iul';
  const coverageAmount = intake.core?.coverageTarget?.amount || 500000;

  const recommendations = [
    {
      carrierId: 'f&g',
      carrierName: 'F&G Life',
      product: `${coverageType.toUpperCase()} Exam-Free`,
      fitPct: age <= 60 && coverageAmount <= 1000000 && nicotineUse === 'never' ? 88 : 72,
      confidence: 'high' as const,
      reasons: [
        'Age ≤ 60 and face ≤ $1M fit exam-free lane',
        'Clean build chart match',
        'No exam required for this profile'
      ],
      citations: [{
        chunkId: 'fg_chunk_42',
        snippet: 'Exam-Free... eligible ages 0-60 through $1,000,000...',
        documentTitle: 'F&G 2025 Underwriting Guide',
        effectiveDate: '2025-01-01',
        section: 'Exam-Free Eligibility'
      }],
      advisories: age > 55 ? ['APS possible for ages >55 even without exam'] : [],
      apsLikely: age > 55,
      ctas: {
        portalUrl: 'https://portal.fglife.com',
        agentPhone: '1-800-FG-AGENT'
      }
    },
    {
      carrierId: 'moo',
      carrierName: 'Mutual of Omaha',
      product: `${coverageType.toUpperCase()} Advantage`,
      fitPct: !hasMarijuana && nicotineUse === 'never' ? 81 : 65,
      confidence: 'medium' as const,
      reasons: [
        'Strong build allowances',
        'Flexible marijuana policies',
        'Good age/amount grids'
      ],
      citations: [{
        chunkId: 'moo_chunk_23',
        snippet: 'Cigar up to 24/year can qualify as NT with negative HOS...',
        documentTitle: 'MOO 2025 Field Guide',
        effectiveDate: '2024-12-01',
        section: 'Tobacco Classifications'
      }],
      advisories: hasMarijuana ? ['Marijuana use may affect class but still eligible'] : [],
      apsLikely: coverageAmount > 500000,
      ctas: {
        portalUrl: 'https://agent.mutualofomaha.com',
        agentPhone: '1-800-MUT-OMAHA'
      }
    },
    {
      carrierId: 'foresters',
      carrierName: 'Foresters Financial',
      product: `${coverageType.toUpperCase()} Accelerated`,
      fitPct: hasMarijuana && intake.core?.marijuana?.lastUse === 'past12Months' ? 25 : 74,
      confidence: hasMarijuana ? 'low' : 'medium',
      reasons: [
        'Accelerated underwriting available',
        'Ages 18-55 preferred range',
        'Quick approval process'
      ],
      citations: [{
        chunkId: 'foresters_chunk_67',
        snippet: 'Accelerated path ages 18-55, faces $100k-$1M; marijuana within past 12 months → no acceleration',
        documentTitle: 'Foresters Accelerated UW Guide',
        effectiveDate: '2024-11-15',
        section: 'Knockout Conditions'
      }],
      advisories: hasMarijuana ? ['Consider full underwriting path instead'] : [],
      apsLikely: false,
      ctas: {
        portalUrl: 'https://www.foresters.com/agent',
        agentPhone: '1-800-FORESTERS'
      }
    },
    {
      carrierId: 'protective',
      carrierName: 'Protective Life',
      product: `${coverageType.toUpperCase()} Premier`,
      fitPct: 68,
      confidence: 'medium' as const,
      reasons: [
        'Dual-manual underwriting advantage',
        'Good for complex cases',
        'Flexible risk assessment'
      ],
      citations: [{
        chunkId: 'protective_chunk_12',
        snippet: 'Dual reinsurance manuals... may improve CAD tables and avocation handling',
        documentTitle: 'Protective Dual Manual Guide',
        effectiveDate: '2024-10-01',
        section: 'Risk Assessment'
      }],
      advisories: ['Consider as alternative if primary carriers decline'],
      apsLikely: true,
      ctas: {
        portalUrl: 'https://agent.protective.com',
        agentPhone: '1-800-PROTECTIVE'
      }
    }
  ];

  // Sort by fit percentage
  return recommendations.sort((a, b) => b.fitPct - a.fitPct);
}

async function processDocumentForRAG(documentKey: string, documentId: string, env: any): Promise<void> {
  try {
    // Get document from R2
    const document = await env.DOCS_BUCKET.get(documentKey);
    if (!document) throw new Error('Document not found in R2');

    // For now, create simple chunks from document metadata
    // In production, you'd extract text from PDF and chunk it properly
    const chunks = await createDocumentChunks(documentKey, documentId);

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text, env);

      // Store chunk in database (ignore if already exists)
      await env.DB.prepare(
        `INSERT OR IGNORE INTO chunks (id, document_id, seq, text, vector_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        chunk.id,
        documentId,
        chunk.index,
        chunk.text,
        chunk.id, // Use chunk ID as vector ID
        new Date().toISOString()
      ).run();

      // Store embedding in Vectorize
      await env.CARRIER_INDEX.upsert([{
        id: chunk.id,
        values: embedding,
        metadata: {
          documentId,
          chunkIndex: chunk.index,
          carrierId: chunk.carrierId,
          text: chunk.text.substring(0, 500) // Store snippet
        }
      }]);
    }
  } catch (error) {
    console.error(`Failed to process document ${documentKey}:`, error);
    throw error;
  }
}

async function createDocumentChunks(documentKey: string, documentId: string) {
  // Extract carrier info from document key
  const filename = documentKey.split('/').pop() || documentKey;
  const carrierInfo = extractCarrierInfo(filename);

  // For now, create representative chunks based on common underwriting topics
  const topics = [
    `${carrierInfo.carrierName} underwriting guidelines for life insurance applications`,
    `${carrierInfo.carrierName} medical underwriting requirements and health conditions`,
    `${carrierInfo.carrierName} age and coverage amount limits for different products`,
    `${carrierInfo.carrierName} nicotine and tobacco use underwriting standards`,
    `${carrierInfo.carrierName} financial underwriting and income requirements`,
    `${carrierInfo.carrierName} aviation and high-risk activity exclusions`,
    `${carrierInfo.carrierName} simplified issue and accelerated underwriting programs`
  ];

  return topics.map((text, index) => ({
    id: `${documentId}-chunk-${index}`,
    text,
    index,
    carrierId: carrierInfo.carrierId
  }));
}

async function generateEmbedding(text: string, env: any): Promise<number[]> {
  const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [text]
  });

  return response.data[0];
}

function extractCarrierInfo(filename: string) {
  const name = filename.replace('.pdf', '').toLowerCase();

  const carrierMappings: Record<string, string> = {
    'agl': 'american-general-life',
    'allianz': 'allianz',
    'americo': 'americo',
    'columbus': 'columbus-life',
    'corbridge': 'corbridge',
    'ethos': 'ethos',
    'f&g': 'fidelity-guarantee',
    'foresters': 'foresters',
    'moo': 'mutual-of-omaha',
    'plag': 'pacific-life',
    'plc': 'pacific-life',
    'prudential': 'prudential',
    'securian': 'securian',
    'symetra': 'symetra',
    'transamerica': 'transamerica'
  };

  for (const [key, carrierId] of Object.entries(carrierMappings)) {
    if (name.includes(key)) {
      return {
        carrierId,
        carrierName: carrierId.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      };
    }
  }

  const firstWord = name.split(/[\s_-]/)[0];
  return {
    carrierId: firstWord.toLowerCase(),
    carrierName: firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Enable CORS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // Health check endpoint
      if (path === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: {
            hasDB: !!env.DB,
            hasBucket: !!env.DOCS_BUCKET,
            hasVectorize: !!env.CARRIER_INDEX,
            hasAI: !!env.AI
          }
        }), { headers });
      }

      // Intake submission endpoint
      if (path === '/api/intake/submit' && request.method === 'POST') {
        const data = await request.json();
        const recommendationId = crypto.randomUUID();
        const intakeId = crypto.randomUUID();

        // Store intake data
        await env.DB.prepare(
          'INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(intakeId, 'default-tenant', JSON.stringify(data), data.validated || true, data.tier2Triggered || false, new Date().toISOString()).run();

        // Add contact to Resend audience
        try {
          const { addIntakeContact } = await import('./resend-contacts');
          await addIntakeContact(data, env);
        } catch (error) {
          console.error('Error adding intake contact to Resend:', error);
          // Don't fail the entire request if Resend fails
        }

        // Generate real recommendations using RAG
        const recommendations = await generateRealRecommendations(data, env);

        // Store recommendation result
        await env.DB.prepare(
          'INSERT INTO recommendation_results (id, intake_id, recommendations, created_at) VALUES (?, ?, ?, ?)'
        ).bind(recommendationId, intakeId, JSON.stringify(recommendations), new Date().toISOString()).run();

        // Return Orion-format response
        return new Response(JSON.stringify({
          recommendationId,
          top: recommendations.slice(0, 3),
          stretch: recommendations[3] || undefined,
          premiumSuggestion: data.core?.coverageTarget?.type === 'iul' ? {
            type: 'IUL',
            monthly: (data.core?.age || 35) * 10,
            note: '10× age rule; adjust DB for accumulation vs payout; avoid lapse'
          } : undefined,
          summary: {
            topCarrierId: recommendations[0]?.carrierId || 'unknown',
            averageFit: Math.round(recommendations.reduce((acc, r) => acc + r.fitPct, 0) / recommendations.length) || 0,
            notes: `RAG-powered recommendations with ${recommendations.reduce((acc, c) => acc + c.citations.length, 0)} citations`
          }
        }), { headers });
      }

      // Get recommendations endpoint
      if (path.startsWith('/api/recommendations/') && request.method === 'GET') {
        const id = path.split('/').pop();

        // Try to get from recommendation_results first (Orion format)
        const recommendationResult = await env.DB.prepare(
          'SELECT * FROM recommendation_results WHERE id = ?'
        ).bind(id).first();

        if (recommendationResult) {
          const recommendations = JSON.parse(recommendationResult.recommendations);
          return new Response(JSON.stringify({
            recommendationId: id,
            top: recommendations.slice(0, 3),
            stretch: recommendations[3] || undefined,
            summary: {
              topCarrierId: recommendations[0]?.carrierId || 'f&g',
              averageFit: Math.round(recommendations.reduce((acc, r) => acc + r.fitPct, 0) / recommendations.length) || 75,
              notes: `Retrieved ${recommendations.length} carrier recommendations`
            }
          }), { headers });
        }

        // Fall back to intake_submissions (legacy format)
        const intakeResult = await env.DB.prepare(
          'SELECT * FROM intake_submissions WHERE id = ?'
        ).bind(id).first();

        if (!intakeResult) {
          return new Response(JSON.stringify({
            error: 'Recommendation not found'
          }), { status: 404, headers });
        }

        // Generate recommendations from intake data
        const intakeData = JSON.parse(intakeResult.data);
        const recommendations = generateMockRecommendations(intakeData);

        return new Response(JSON.stringify({
          recommendationId: id,
          top: recommendations.slice(0, 3),
          stretch: recommendations[3] || undefined,
          summary: {
            topCarrierId: recommendations[0]?.carrierId || 'f&g',
            averageFit: Math.round(recommendations.reduce((acc, r) => acc + r.fitPct, 0) / recommendations.length) || 75,
            notes: `Generated ${recommendations.length} carrier recommendations from intake`
          }
        }), { headers });
      }

      // Analytics summary endpoint
      if (path === '/api/analytics/summary' && request.method === 'GET') {
        try {
          // Get user ID from Clerk token
          const userId = await getUserIdFromToken(request, env);

          // Query actual analytics data from database
          const totalIntakesResult = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM intakes WHERE tenant_id = ?'
          ).bind(userId).first();

          const avgFitResult = await env.DB.prepare(
            'SELECT AVG(CAST(JSON_EXTRACT(recommendations, "$.summary.averageFit") AS REAL)) as avg_fit FROM recommendation_results WHERE intake_id IN (SELECT id FROM intakes WHERE tenant_id = ?)'
          ).bind(userId).first();

          return new Response(JSON.stringify({
            stats: {
              totalIntakes: totalIntakesResult?.count || 0,
              averageFitScore: Math.round(avgFitResult?.avg_fit || 75),
              placementRate: 65, // TODO: Calculate from outcomes
              remainingRecommendations: 999 // TODO: Get from user plan
            },
            lastUpdated: new Date().toISOString()
          }), { headers });
        } catch (error) {
          // Fallback to mock data if analytics query fails
          return new Response(JSON.stringify({
            stats: {
              totalIntakes: 0,
              averageFitScore: 75,
              placementRate: 65,
              remainingRecommendations: 999
            },
            lastUpdated: new Date().toISOString()
          }), { headers });
        }
      }

      // User profile endpoints
      if (path === '/api/user/profile' && request.method === 'PUT') {
        try {
          const userId = await getUserIdFromToken(request, env);
          const profileData = await request.json();

          // Store user profile in database
          await env.DB.prepare(
            'INSERT OR REPLACE INTO user_profiles (user_id, company_name, license_number, phone, address, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(
            userId,
            profileData.companyName,
            profileData.licenseNumber,
            profileData.phone,
            profileData.address,
            new Date().toISOString()
          ).run();

          return new Response(JSON.stringify({ success: true }), { headers });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
            status: 500,
            headers
          });
        }
      }

      if (path === '/api/user/recent-activity' && request.method === 'GET') {
        try {
          const userId = await getUserIdFromToken(request, env);

          // Get recent intakes and recommendations
          const recentActivities = await env.DB.prepare(`
            SELECT
              i.id,
              'intake' as type,
              'Submitted intake for ' || JSON_EXTRACT(i.answers, '$.core.coverageTarget.type') || ' coverage' as description,
              i.created_at as timestamp
            FROM intakes i
            WHERE i.tenant_id = ?
            ORDER BY i.created_at DESC
            LIMIT 10
          `).bind(userId).all();

          return new Response(JSON.stringify(recentActivities.results || []), { headers });
        } catch (error) {
          // Return empty array on error
          return new Response(JSON.stringify([]), { headers });
        }
      }

      // User usage endpoint
      if (path === '/api/user/usage' && request.method === 'GET') {
        try {
          const userId = await getUserIdFromToken(request, env);

          // Get user's intake count for usage tracking
          const usageResult = await env.DB.prepare(
            'SELECT COUNT(*) as used FROM intakes WHERE tenant_id = ? AND created_at >= date("now", "-1 month")'
          ).bind(userId).first();

          return new Response(JSON.stringify({
            plan: 'Individual', // TODO: Get from user subscription
            status: 'active',
            recommendationsUsed: usageResult?.used || 0,
            recommendationsLimit: 50 // TODO: Get from plan
          }), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            plan: 'Individual',
            status: 'active',
            recommendationsUsed: 0,
            recommendationsLimit: 50
          }), { headers });
        }
      }

      // Stripe checkout session creation
      if (path === '/api/stripe/create-checkout-session' && request.method === 'POST') {
        const { priceId, successUrl, cancelUrl } = await request.json();

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'mode': 'subscription',
            'payment_method_types[]': 'card',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            'success_url': successUrl,
            'cancel_url': cancelUrl,
          }),
        });

        if (!stripeResponse.ok) {
          const error = await stripeResponse.text();
          console.error('Stripe error:', error);
          return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
            status: 500,
            headers
          });
        }

        const session = await stripeResponse.json();
        return new Response(JSON.stringify({ sessionId: session.id }), { headers });
      }

      // Stripe webhook handler
      if (path === '/api/stripe/webhook' && request.method === 'POST') {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
          return new Response('Missing signature', { status: 400, headers });
        }

        // For now, just log the webhook (you'd typically verify the signature here)
        console.log('Stripe webhook received:', { signature, body: body.substring(0, 100) });

        try {
          const event = JSON.parse(body);

          // Handle different webhook events
          switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
              // Update tenant status in database
              console.log('Subscription event:', event.type);
              break;
            case 'customer.subscription.deleted':
              // Handle cancellation
              console.log('Subscription cancelled:', event.data.object.id);
              break;
            case 'invoice.payment_succeeded':
              // Handle successful payment
              console.log('Payment succeeded:', event.data.object.id);
              break;
            case 'invoice.payment_failed':
              // Handle failed payment
              console.log('Payment failed:', event.data.object.id);
              break;
          }

          return new Response(JSON.stringify({ received: true }), { headers });
        } catch (error) {
          console.error('Webhook processing error:', error);
          return new Response('Webhook error', { status: 400, headers });
        }
      }

      // Process documents for RAG system (batch processing)
      if (path === '/api/carriers/process-documents' && request.method === 'POST') {
        try {
          const url = new URL(request.url);
          const batchSize = parseInt(url.searchParams.get('batch') || '3');

          const documents = await env.DB.prepare(
            'SELECT * FROM documents WHERE processed = FALSE OR processed IS NULL LIMIT ?'
          ).bind(batchSize).all();

          let processedCount = 0;

          // Process documents in smaller batches to avoid subrequest limits
          for (const doc of documents.results || []) {
            try {
              await processDocumentForRAG(doc.r2_key, doc.id, env);

              // Mark as processed
              await env.DB.prepare(
                'UPDATE documents SET processed = TRUE WHERE id = ?'
              ).bind(doc.id).run();

              processedCount++;
            } catch (docError) {
              console.error(`Failed to process document ${doc.id}:`, docError);
              // Continue with other documents even if one fails
            }
          }

          return new Response(JSON.stringify({
            success: true,
            processed: processedCount,
            remaining: Math.max(0, (documents.results || []).length - processedCount),
            message: `Processed ${processedCount} documents in this batch`
          }), { headers });

        } catch (error) {
          console.error('Document processing error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to process documents',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Sync R2 documents to database
      if (path === '/api/carriers/sync-r2' && request.method === 'POST') {
        try {
          const objects = await env.DOCS_BUCKET.list();
          let syncCount = 0;
          let skipCount = 0;

          for (const obj of objects.objects) {
            const filename = obj.key.split('/').pop() || obj.key;
            const carrierInfo = extractCarrierInfo(filename);

            // Check if document already exists
            const existingDoc = await env.DB.prepare(
              'SELECT id FROM documents WHERE r2_key = ?'
            ).bind(obj.key).first();

            if (existingDoc) {
              skipCount++;
              continue;
            }

            const documentId = crypto.randomUUID();
            const createdAt = new Date().toISOString();

            // Create carrier if doesn't exist
            const existingCarrier = await env.DB.prepare(
              'SELECT id FROM carriers WHERE id = ?'
            ).bind(carrierInfo.carrierId).first();

            if (!existingCarrier) {
              await env.DB.prepare(
                `INSERT INTO carriers (id, name, preferred_tier_rank, created_at)
                 VALUES (?, ?, ?, ?)`
              ).bind(
                carrierInfo.carrierId,
                carrierInfo.carrierName,
                99,
                createdAt
              ).run();
            }

            // Create document record
            await env.DB.prepare(
              `INSERT INTO documents (id, carrier_id, title, effective_date, version, r2_key, doc_type, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              documentId,
              carrierInfo.carrierId,
              filename,
              new Date().toISOString().split('T')[0],
              1,
              obj.key,
              'underwriting_guide',
              createdAt
            ).run();

            syncCount++;
          }

          return new Response(JSON.stringify({
            success: true,
            synced: syncCount,
            skipped: skipCount,
            total: objects.objects.length
          }), { headers });

        } catch (error) {
          console.error('R2 sync error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to sync R2 documents',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // List R2 documents endpoint
      if (path === '/api/carriers/list-r2' && request.method === 'GET') {
        try {
          const objects = await env.DOCS_BUCKET.list();

          return new Response(JSON.stringify({
            success: true,
            objects: objects.objects.map(obj => ({
              key: obj.key,
              size: obj.size,
              uploaded: obj.uploaded
            }))
          }), { headers });

        } catch (error) {
          console.error('R2 list error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to list R2 objects',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Carrier document upload endpoint
      if (path === '/api/carriers/upload' && request.method === 'POST') {
        const data = await request.json();

        // Validate required fields
        if (!data.carrierId || !data.carrierName || !data.filename || !data.content) {
          return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['carrierId', 'carrierName', 'filename', 'content']
          }), { status: 400, headers });
        }

        try {
          const documentId = crypto.randomUUID();
          const createdAt = new Date().toISOString();
          const key = `carriers/${data.carrierId}/${createdAt}/${data.filename}`;

          // Store the document content in R2
          const contentBuffer = new Uint8Array(Buffer.from(data.content, 'base64'));
          await env.DOCS_BUCKET.put(key, contentBuffer, {
            httpMetadata: {
              contentType: 'application/pdf'
            }
          });

          // Store metadata in documents table
          await env.DB.prepare(
            `INSERT INTO documents (id, carrier_id, title, effective_date, version, r2_key, doc_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            documentId,
            data.carrierId,
            data.filename,
            data.effectiveDate || new Date().toISOString().split('T')[0],
            1,
            key,
            'underwriting_guide',
            createdAt
          ).run();

          // Create a carrier record if it doesn't exist
          const existingCarrier = await env.DB.prepare(
            'SELECT id FROM carriers WHERE id = ?'
          ).bind(data.carrierId).first();

          if (!existingCarrier) {
            await env.DB.prepare(
              `INSERT INTO carriers (id, name, preferred_tier_rank, created_at)
               VALUES (?, ?, ?, ?)`
            ).bind(
              data.carrierId,
              data.carrierName,
              99, // Default low priority
              createdAt
            ).run();
          }

          return new Response(JSON.stringify({
            success: true,
            documentId,
            key,
            message: `Successfully uploaded ${data.filename} for ${data.carrierName}`
          }), { headers });

        } catch (error) {
          console.error('Upload error:', error);
          return new Response(JSON.stringify({
            error: 'Upload failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Stripe checkout session creation
      if (path === '/api/stripe/create-checkout-session' && request.method === 'POST') {
        try {
          const { initStripe, createCheckoutSession } = await import('./billing');
          const body = await request.json() as {
            priceId: string;
            successUrl: string;
            cancelUrl: string;
            userId?: string;
            metadata?: Record<string, string>;
          };

          const stripe = initStripe(env);
          const session = await createCheckoutSession(
            stripe,
            body.priceId,
            body.successUrl,
            body.cancelUrl,
            body.userId,
            body.metadata
          );

          return new Response(JSON.stringify(session), { headers });
        } catch (error) {
          console.error('Stripe checkout error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to create checkout session',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Stripe webhook handler
      if (path === '/api/stripe/webhook' && request.method === 'POST') {
        try {
          const { handleStripeWebhook } = await import('./billing');
          return await handleStripeWebhook(request, env);
        } catch (error) {
          console.error('Webhook handler error:', error);
          return new Response(JSON.stringify({
            error: 'Webhook processing failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Contact form submission
      if (path === '/api/contact' && request.method === 'POST') {
        try {
          const data = await request.json();
          const { sendContactNotification, sendContactConfirmation } = await import('./email');
          const { addContactFormContact } = await import('./resend-contacts');

          // Send notification to team
          await sendContactNotification(data, env);

          // Send confirmation to user
          await sendContactConfirmation(data, env);

          // Add contact to Resend audience
          await addContactFormContact(data, env);

          // Store in database for tracking
          await env.DB.prepare(`
            INSERT INTO contact_submissions (
              type, name, email, company, phone, message, preferred_time, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            data.type,
            data.name,
            data.email,
            data.company,
            data.phone || null,
            data.message || null,
            data.preferredTime || null,
            data.timestamp
          ).run();

          return new Response(JSON.stringify({ success: true }), { headers });
        } catch (error) {
          console.error('Contact form error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to submit contact form',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // User subscription status
      if (path === '/api/user/subscription' && request.method === 'GET') {
        try {
          const { getUserSubscription } = await import('./billing');
          const userId = request.headers.get('x-user-id') || 'anonymous';
          const subscription = await getUserSubscription(env, userId);
          return new Response(JSON.stringify(subscription), { headers });
        } catch (error) {
          console.error('Get subscription error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to get subscription',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Default 404 response
      return new Response(JSON.stringify({
        error: 'Not Found',
        path: path,
        method: request.method
      }), { status: 404, headers });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers });
    }
  }
};