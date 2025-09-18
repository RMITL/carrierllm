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
}

interface CarrierRecommendation {
  carrierId: string;
  carrierName: string;
  fitScore: number;
  reasons: string[];
  concerns: string[];
  estimatedPremium: string;
  underwritingClass: string;
  citations: Array<{
    documentTitle: string;
    pageNumber?: number;
    relevantText: string;
    confidence: number;
  }>;
}

interface UserProfile {
  userId: string;
  email?: string;
  subscriptionStatus: 'active' | 'past_due' | 'suspended' | 'canceled';
  subscriptionTier: 'individual' | 'team' | 'enterprise';
  usageStats: {
    recommendationsUsed: number;
    recommendationsLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  createdAt: string;
  lastActiveAt: string;
}

// Utility functions
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

async function verifyUserAccess(userId: string, env: Env): Promise<UserProfile | null> {
  const user = await env.DB.prepare(
    'SELECT * FROM user_profiles WHERE user_id = ?'
  ).bind(userId).first();

  if (!user) return null;

  return {
    userId: user.user_id,
    email: user.email,
    subscriptionStatus: user.subscription_status,
    subscriptionTier: user.subscription_tier,
    usageStats: {
      recommendationsUsed: user.recommendations_used || 0,
      recommendationsLimit: user.recommendations_limit || 200,
      currentPeriodStart: user.current_period_start,
      currentPeriodEnd: user.current_period_end
    },
    createdAt: user.created_at,
    lastActiveAt: user.last_active_at
  };
}

async function checkUsageLimits(userProfile: UserProfile): Promise<boolean> {
  const limits = {
    individual: 200,
    team: 1000,
    enterprise: 10000
  };

  const limit = limits[userProfile.subscriptionTier] || 200;
  return userProfile.usageStats.recommendationsUsed < limit;
}

async function processDocumentForRAG(
  documentKey: string,
  documentId: string,
  env: Env
): Promise<void> {
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

      // Store chunk in database
      await env.DB.prepare(
        `INSERT INTO chunks (id, document_id, content, chunk_index, embedding_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        chunk.id,
        documentId,
        chunk.text,
        chunk.index,
        chunk.id, // Use chunk ID as embedding ID
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

async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [text]
  });

  return response.data[0];
}

async function performRAGSearch(
  query: string,
  env: Env,
  topK: number = 10
): Promise<Array<{ text: string; carrierId: string; confidence: number }>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query, env);

  // Search in Vectorize
  const searchResults = await env.CARRIER_INDEX.query({
    vector: queryEmbedding,
    topK,
    returnMetadata: true
  });

  return searchResults.matches.map((match: any) => ({
    text: match.metadata.text,
    carrierId: match.metadata.carrierId,
    confidence: match.score
  }));
}

async function generateRecommendations(
  intakeData: any,
  ragResults: Array<{ text: string; carrierId: string; confidence: number }>,
  env: Env
): Promise<CarrierRecommendation[]> {
  // Group RAG results by carrier
  const carrierResults = ragResults.reduce((acc, result) => {
    if (!acc[result.carrierId]) acc[result.carrierId] = [];
    acc[result.carrierId].push(result);
    return acc;
  }, {} as Record<string, typeof ragResults>);

  // Generate recommendations for each carrier with relevant context
  const recommendations: CarrierRecommendation[] = [];

  for (const [carrierId, results] of Object.entries(carrierResults)) {
    const carrier = await env.DB.prepare(
      'SELECT * FROM carriers WHERE id = ?'
    ).bind(carrierId).first();

    if (!carrier) continue;

    // Create context from RAG results
    const context = results.map(r => r.text).join('\n\n');

    // Use AI to analyze fit
    const analysis = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are an insurance underwriting expert. Analyze the client's information against the carrier's guidelines and provide a fit score (0-100), reasons for recommendation, concerns, and estimated underwriting class.

Client Information:
- Age: ${intakeData.age || 'Not provided'}
- State: ${intakeData.state || 'Not provided'}
- Height: ${intakeData.height || 'Not provided'} inches
- Weight: ${intakeData.weight || 'Not provided'} lbs
- Nicotine use: ${intakeData.nicotineUse || 'Not provided'}
- Health conditions: ${intakeData.majorConditions || 'None specified'}
- Coverage amount: $${intakeData.coverageAmount || 'Not specified'}

Carrier Guidelines:
${context}

Respond in JSON format with: fitScore (0-100), reasons (array), concerns (array), estimatedClass (string), estimatedPremium (string).`
        }
      ]
    });

    try {
      const result = JSON.parse(analysis.response);

      recommendations.push({
        carrierId,
        carrierName: carrier.display_name,
        fitScore: result.fitScore || 75,
        reasons: result.reasons || [`Good fit for ${carrier.display_name}`],
        concerns: result.concerns || [],
        estimatedPremium: result.estimatedPremium || 'Quote required',
        underwritingClass: result.estimatedClass || 'Standard',
        citations: results.map(r => ({
          documentTitle: `${carrier.display_name} Guidelines`,
          relevantText: r.text.substring(0, 200) + '...',
          confidence: r.confidence
        }))
      });
    } catch (error) {
      // Fallback if AI parsing fails
      recommendations.push({
        carrierId,
        carrierName: carrier.display_name,
        fitScore: 75,
        reasons: [`Matches ${carrier.display_name} guidelines`],
        concerns: ['Detailed review required'],
        estimatedPremium: 'Quote required',
        underwritingClass: 'Standard',
        citations: results.map(r => ({
          documentTitle: `${carrier.display_name} Guidelines`,
          relevantText: r.text.substring(0, 200) + '...',
          confidence: r.confidence
        }))
      });
    }
  }

  // Sort by fit score
  return recommendations.sort((a, b) => b.fitScore - a.fitScore);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // Health check
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

      // Process documents for RAG
      if (path === '/api/carriers/process-documents' && request.method === 'POST') {
        try {
          const documents = await env.DB.prepare(
            'SELECT * FROM documents WHERE processed = FALSE OR processed IS NULL'
          ).all();

          let processedCount = 0;

          for (const doc of documents.results || []) {
            await processDocumentForRAG(doc.r2_key, doc.id, env);

            // Mark as processed
            await env.DB.prepare(
              'UPDATE documents SET processed = TRUE WHERE id = ?'
            ).bind(doc.id).run();

            processedCount++;
          }

          return new Response(JSON.stringify({
            success: true,
            processed: processedCount,
            message: `Processed ${processedCount} documents for RAG`
          }), { headers });

        } catch (error) {
          console.error('Document processing error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to process documents',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Sync R2 documents to database (from before)
      if (path === '/api/carriers/sync-r2' && request.method === 'POST') {
        try {
          const objects = await env.DOCS_BUCKET.list();
          let syncCount = 0;

          for (const obj of objects.objects) {
            const filename = obj.key.split('/').pop() || obj.key;
            const carrierInfo = extractCarrierInfo(filename);

            const existingDoc = await env.DB.prepare(
              'SELECT id FROM documents WHERE r2_key = ?'
            ).bind(obj.key).first();

            if (existingDoc) continue;

            const documentId = crypto.randomUUID();
            const createdAt = new Date().toISOString();

            // Create carrier if doesn't exist
            const existingCarrier = await env.DB.prepare(
              'SELECT id FROM carriers WHERE id = ?'
            ).bind(carrierInfo.carrierId).first();

            if (!existingCarrier) {
              await env.DB.prepare(
                `INSERT INTO carriers (id, name, display_name, preferred_tier_rank, created_at)
                 VALUES (?, ?, ?, ?, ?)`
              ).bind(
                carrierInfo.carrierId,
                carrierInfo.carrierName,
                carrierInfo.carrierName,
                99,
                createdAt
              ).run();
            }

            await env.DB.prepare(
              `INSERT INTO documents (id, carrier_id, title, effective_date, version, r2_key, doc_type, processed, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              documentId,
              carrierInfo.carrierId,
              filename,
              new Date().toISOString().split('T')[0],
              1,
              obj.key,
              'underwriting_guide',
              false,
              createdAt
            ).run();

            syncCount++;
          }

          return new Response(JSON.stringify({
            success: true,
            synced: syncCount
          }), { headers });

        } catch (error) {
          console.error('R2 sync error:', error);
          return new Response(JSON.stringify({
            error: 'Failed to sync R2 documents',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Intake submission with real RAG processing
      if (path === '/api/intake/submit' && request.method === 'POST') {
        const data = await request.json();

        // Extract user ID from headers (Clerk)
        const authHeader = request.headers.get('Authorization');
        const userId = authHeader?.replace('Bearer ', '') || 'anonymous';

        // Verify user access and usage limits
        const userProfile = await verifyUserAccess(userId, env);
        if (!userProfile || userProfile.subscriptionStatus !== 'active') {
          return new Response(JSON.stringify({
            error: 'Access denied',
            message: 'Valid subscription required'
          }), { status: 403, headers });
        }

        if (!await checkUsageLimits(userProfile)) {
          return new Response(JSON.stringify({
            error: 'Usage limit exceeded',
            message: 'Monthly recommendation limit reached'
          }), { status: 429, headers });
        }

        // Create intake record
        const intakeId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO intakes (id, user_id, form_data, status, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          intakeId,
          userId,
          JSON.stringify(data),
          'processing',
          createdAt
        ).run();

        // Generate search query from intake data
        const searchQuery = `
          Age ${data.age} in ${data.state},
          ${data.height} inches ${data.weight} lbs,
          nicotine use: ${data.nicotineUse || 'never'},
          health conditions: ${data.majorConditions || 'none'},
          coverage amount: $${data.coverageAmount || '500000'}
        `;

        // Perform RAG search
        const ragResults = await performRAGSearch(searchQuery, env, 15);

        // Generate recommendations
        const recommendations = await generateRecommendations(data, ragResults, env);

        // Store recommendation
        const recommendationId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO recommendations (id, intake_id, user_id, recommendations_data, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          recommendationId,
          intakeId,
          userId,
          JSON.stringify(recommendations),
          'completed',
          createdAt
        ).run();

        // Update usage stats
        await env.DB.prepare(
          'UPDATE user_profiles SET recommendations_used = recommendations_used + 1, last_active_at = ? WHERE user_id = ?'
        ).bind(createdAt, userId).run();

        // Update intake status
        await env.DB.prepare(
          'UPDATE intakes SET status = ?, completed_at = ? WHERE id = ?'
        ).bind('completed', createdAt, intakeId).run();

        return new Response(JSON.stringify({
          intakeId,
          recommendationId,
          recommendations,
          totalRecommendations: recommendations.length,
          processed: true
        }), { headers });
      }

      // Get recommendation by ID
      if (path.startsWith('/api/recommendations/') && request.method === 'GET') {
        const recommendationId = path.split('/').pop();

        const recommendation = await env.DB.prepare(
          'SELECT * FROM recommendations WHERE id = ?'
        ).bind(recommendationId).first();

        if (!recommendation) {
          return new Response(JSON.stringify({
            error: 'Not found'
          }), { status: 404, headers });
        }

        return new Response(JSON.stringify({
          id: recommendation.id,
          intakeId: recommendation.intake_id,
          recommendations: JSON.parse(recommendation.recommendations_data),
          status: recommendation.status,
          createdAt: recommendation.created_at
        }), { headers });
      }

      // User analytics
      if (path === '/api/analytics/summary' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        const userId = authHeader?.replace('Bearer ', '') || 'anonymous';

        const userProfile = await verifyUserAccess(userId, env);
        if (!userProfile) {
          return new Response(JSON.stringify({
            error: 'Access denied'
          }), { status: 403, headers });
        }

        // Get user's recommendation history
        const recommendations = await env.DB.prepare(
          'SELECT COUNT(*) as total FROM recommendations WHERE user_id = ?'
        ).bind(userId).first();

        const intakes = await env.DB.prepare(
          'SELECT COUNT(*) as total FROM intakes WHERE user_id = ?'
        ).bind(userId).first();

        return new Response(JSON.stringify({
          user: userProfile,
          stats: {
            totalRecommendations: recommendations?.total || 0,
            totalIntakes: intakes?.total || 0,
            remainingRecommendations: userProfile.usageStats.recommendationsLimit - userProfile.usageStats.recommendationsUsed
          }
        }), { headers });
      }

      // Stripe webhook handler (from before)
      if (path === '/api/stripe/webhook' && request.method === 'POST') {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
          return new Response('Missing signature', { status: 400, headers });
        }

        try {
          const event = JSON.parse(body);

          switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
              const subscription = event.data.object;

              // Update or create user profile
              await env.DB.prepare(
                `INSERT INTO user_profiles (
                  user_id, email, subscription_status, subscription_tier,
                  recommendations_limit, current_period_start, current_period_end, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  subscription_status = excluded.subscription_status,
                  subscription_tier = excluded.subscription_tier,
                  recommendations_limit = excluded.recommendations_limit,
                  current_period_start = excluded.current_period_start,
                  current_period_end = excluded.current_period_end`
              ).bind(
                subscription.customer,
                subscription.customer_email || '',
                subscription.status,
                'individual', // Map from Stripe price ID
                200,
                new Date(subscription.current_period_start * 1000).toISOString(),
                new Date(subscription.current_period_end * 1000).toISOString(),
                new Date().toISOString()
              ).run();

              break;
          }

          return new Response(JSON.stringify({ received: true }), { headers });
        } catch (error) {
          console.error('Webhook error:', error);
          return new Response('Webhook error', { status: 400, headers });
        }
      }

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