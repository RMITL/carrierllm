import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  AI: any;
  RESEND_API_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;
  CRON_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
}

const router = Router();

// Helper to format carrier names for display
function formatCarrierName(carrierId: string): string {
  return carrierId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to generate embeddings
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    console.log(`Generating embedding for text of length: ${text.length}`);
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
    console.log(`Embedding response received, dimensions: ${response.data[0]?.length || 'undefined'}`);
    return response.data[0];
  } catch (error) {
    console.error('Embedding generation failed:', error);
    console.error('Error details:', error.message);
    return [];
  }
}

// Helper function to perform RAG search
async function performRAGSearch(query: string, env: Env, topK = 15): Promise<any[]> {
  try {
    console.log('RAG: Starting search for query:', query);
    const queryEmbedding = await generateEmbedding(query, env);
    console.log('RAG: Generated embedding length:', queryEmbedding.length);

    if (queryEmbedding.length === 0) {
      console.log('RAG: Embedding generation failed, returning empty results');
      return [];
    }

    console.log('RAG: About to query Vectorize with embedding of length:', queryEmbedding.length);
    const results = await env.CARRIER_INDEX.query(queryEmbedding, {
      topK,
      returnMetadata: true,
    });

    console.log('RAG: Query successful, found', results.matches?.length || 0, 'matches');
    return results.matches.map((match: any) => match.metadata);
  } catch (error) {
    console.error('RAG search failed:', error);
    console.error('RAG error details:', error.message);
    return [];
  }
}

// Enhanced PCG-based recommendation logic with AI analysis
async function generateRealRecommendations(intakeData: any, env: Env): Promise<any[]> {
  try {
    console.log('Starting generateRealRecommendations with intake data:', intakeData);

    // Create a more comprehensive client profile query
    const coverageAmount = intakeData.core?.coverageTarget?.amount || intakeData.coverage_amount || 500000;
    const clientProfileQuery = `
          Client Profile:
          - Age: ${intakeData.core?.age || intakeData.age || 35}
          - Gender: ${intakeData.core?.gender || intakeData.gender || 'Male'}
          - Health Status: ${intakeData.core?.health || intakeData.health || 'Excellent'}
          - Occupation: ${intakeData.core?.occupation || intakeData.occupation || 'Professional'}
          - Nicotine Use: ${intakeData.core?.nicotine?.lastUse || (intakeData.smoker ? 'current' : 'never')}
          - Health Conditions: ${intakeData.core?.majorConditions || intakeData.family_history || 'none'}
          - Coverage Amount: $${coverageAmount.toLocaleString()}
          - Coverage Type: ${intakeData.core?.coverageTarget?.type || intakeData.coverage_type || 'term'}
          - Term Length: ${intakeData.core?.termLength || intakeData.term_length || 20} years
          - Income: $${(intakeData.core?.income || intakeData.income || 100000).toLocaleString()}
        `;

    console.log('Generated client profile query:', clientProfileQuery);

    const ragResults = await performRAGSearch(clientProfileQuery, env);
    console.log('RAG search completed, found', ragResults.length, 'results');

    if (ragResults.length === 0) {
      console.log('No RAG results found, returning empty recommendations');
      return [];
    }

    // Group results by carrier and analyze with AI
    const carrierGroups = new Map();
    ragResults.forEach((result: any) => {
      const carrierId = result.carrierId || 'unknown';
      if (!carrierGroups.has(carrierId)) {
        carrierGroups.set(carrierId, []);
      }
      carrierGroups.get(carrierId).push(result);
    });

    console.log('Grouped results by carrier:', carrierGroups.size, 'carriers');

    // Generate AI-powered recommendations for each carrier
    const recommendations = [];
    for (const [carrierId, results] of carrierGroups) {
      try {
        const recommendation = await generateCarrierRecommendation(carrierId, results, clientProfileQuery, env);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      } catch (error) {
        console.error(`Error generating recommendation for ${carrierId}:`, error);
      }
    }

    // Sort by fit score (highest first)
    recommendations.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

    console.log('Generated', recommendations.length, 'recommendations');
    return recommendations.slice(0, 10); // Return top 10
  } catch (error) {
    console.error('Error in generateRealRecommendations:', error);
    console.error('Error details:', error.message);
    return [];
  }
}

// Generate AI-powered recommendation for a specific carrier
async function generateCarrierRecommendation(
  carrierId: string,
  results: any[],
  clientProfile: string,
  env: Env,
): Promise<any> {
  try {
    // Combine all text from this carrier's results
    const combinedText = results.map((r) => r.text).join('\n\n');
    const topResult = results[0]; // Use the highest scoring result

    // Create AI prompt for PCG analysis
    const aiPrompt = `
        You are an insurance underwriting expert. Analyze the carrier's underwriting guidelines for the given client profile and provide a PCG (Preferential Carrier Grade) assessment.

        CLIENT PROFILE:
        ${clientProfile}

        CARRIER: ${carrierId}
        UNDERWRITING GUIDELINES:
        ${combinedText.substring(0, 2000)}

        IMPORTANT: Respond ONLY with valid JSON in this exact format:
        {
          "fitPct": 85,
          "reasons": ["Age is within preferred range", "No nicotine use", "Excellent health"],
          "advisories": ["High income may require additional documentation"],
          "confidence": 90,
          "product": "Life Insurance",
          "underwritingPath": "standard",
          "citations": [{"source": "Carrier Guidelines", "text": "Relevant excerpt from guidelines"}]
        }

        Analysis criteria:
        - fitPct: 0-100 based on how well client matches carrier guidelines
        - reasons: 3-5 specific positive factors
        - advisories: 0-3 potential concerns or requirements
        - confidence: 0-100 based on data quality
        - product: "Life Insurance", "Term Life", "IUL", etc.
        - underwritingPath: "simplified", "standard", or "complex"
        - citations: 1-3 relevant excerpts from guidelines

        Respond with ONLY the JSON object, no other text.`;

    console.log(`Generating AI analysis for ${carrierId}...`);

    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      max_tokens: 1000,
    });

    let analysis;
    try {
      // Try to parse the AI response as JSON
      const responseText = aiResponse.response || aiResponse.choices?.[0]?.message?.content || '';
      console.log(`AI response for ${carrierId}:`, responseText.substring(0, 200));

      // Try multiple JSON extraction methods
      let jsonText = '';

      // Method 1: Look for JSON object (more robust)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        // Fallback if no JSON object is found
        throw new Error('No JSON object found in AI response');
      }

      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(`Failed to parse AI response for ${carrierId}:`, parseError);
      // Fallback to basic analysis based on RAG score
      const baseScore = Math.round((topResult.score || 0.5) * 100);
      analysis = {
        fitPct: Math.max(60, baseScore), // Ensure minimum 60% for successful RAG matches
        reasons: [`${formatCarrierName(carrierId)} underwriting guidelines match client profile`],
        advisories: [],
        confidence: 70,
        product: 'Life Insurance',
        underwritingPath: 'standard',
        citations: [],
      };
    }

    return {
      carrierId: carrierId,
      carrierName: formatCarrierName(carrierId),
      fitScore: Math.max(0, Math.min(100, analysis.fitPct || 0)),
      reasoning: {
        pros: analysis.reasons || [`${carrierId} guidelines applicable`],
        cons: analysis.advisories || [],
        summary: `Fit score of ${Math.max(0, Math.min(100, analysis.fitPct || 0))}% based on underwriting criteria.`,
      },
      estimatedPremium: {
        monthly: Math.round(1200 + (100 - (analysis.fitPct || 0)) * 10),
        annual: Math.round((1200 + (100 - (analysis.fitPct || 0)) * 10) * 12),
      },
      confidence: analysis.confidence >= 80 ? 'high' : analysis.confidence >= 60 ? 'medium' : 'low',
      citations: (analysis.citations || [{ source: topResult.source, text: topResult.text.substring(0, 200) }]).map(
        (citation: any, index: number) => ({
          chunkId: `${carrierId}-${index}`,
          snippet: citation.text || citation.snippet || '',
          documentTitle: citation.source || 'Carrier Underwriting Guide',
          effectiveDate: new Date().toISOString(),
          score: topResult.score || 0.8,
        }),
      ),
    };
  } catch (error) {
    console.error(`Error in generateCarrierRecommendation for ${carrierId}:`, error);
    return null;
  }
}

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
    'Content-Type': 'application/json'
  };
}

// CORS preflight
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
});

// Health check
router.get('/api/health', () => {
  return Response.json(
    { status: 'healthy', timestamp: new Date().toISOString() },
    { headers: corsHeaders() }
  );
});

// Test carriers endpoint
router.get('/api/carriers/test', () => {
  return Response.json(
    { message: 'Carriers test endpoint working' },
    { headers: corsHeaders() }
  );
});

// Analytics endpoint with live data
router.get('/api/analytics/summary', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');

    // Get current month for date filtering
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Initialize response data with real zeros
    let stats = {
      totalIntakes: 0,
      averageFitScore: 0,
      placementRate: 0,
      remainingRecommendations: 0
    };

    let topCarriers: any[] = [];
    let trends: any[] = [];

    try {
      // Get total intakes - check multiple tables for compatibility
      const intakesResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM intakes
          UNION ALL
          SELECT id FROM intake_submissions
        )
      `).first();

      stats.totalIntakes = (intakesResult as { count: number })?.count || 0;

      // If we have a user ID, get user-specific data
      if (userId) {
        // Get user's monthly usage
        try {
          const userUsage = await env.DB.prepare(`
            SELECT COUNT(*) as used
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
          `).bind(userId, monthStart).first();

          const used = userUsage?.used || 0;
          // Get user's actual limit from their profile
          const userProfile = await env.DB.prepare(
            'SELECT recommendations_limit FROM user_profiles WHERE user_id = ?'
          ).bind(userId).first();
          
          const limit = (userProfile as { recommendations_limit: number })?.recommendations_limit || 0;
          stats.remainingRecommendations = Math.max(0, limit - used);
        } catch (e) {
          console.log('Could not get user usage:', e);
        }

        // Get user's average fit score
        try {
          const avgScore = await env.DB.prepare(`
            SELECT AVG(fit_score) as avg
            FROM recommendations
            WHERE user_id = ?
          `).bind(userId).first();

          if ((avgScore as { avg: number })?.avg) {
            stats.averageFitScore = Math.round((avgScore as { avg: number }).avg);
          } else {
            stats.averageFitScore = 0;
          }
        } catch (e) {
          console.log('Could not get average score:', e);
        }

        // Get top carriers
        try {
          const carriers = await env.DB.prepare(`
            SELECT
              carrier_id,
              carrier_name,
              COUNT(*) as count,
              AVG(fit_score) as avg_score
            FROM recommendations
            WHERE user_id = ?
            GROUP BY carrier_id, carrier_name
            ORDER BY count DESC
            LIMIT 5
          `).bind(userId).all();

          if (carriers?.results) {
            topCarriers = carriers.results.map((c: any, idx: number) => ({
              id: c.carrier_id || String(idx + 1),
              name: c.carrier_name || `Carrier ${idx + 1}`,
              count: c.count || 0,
              successRate: Math.round(c.avg_score || 0)
            }));
          }
        } catch (e) {
          console.log('Could not get top carriers:', e);
        }

        // Get monthly trends (last 6 months)
        try {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const monthlyData = await env.DB.prepare(`
            SELECT
              strftime('%Y-%m', created_at) as month,
              COUNT(*) as count
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 6
          `).bind(userId, sixMonthsAgo.toISOString()).all();

          if (monthlyData?.results) {
            trends = monthlyData.results.map((m: any) => ({
              month: m.month,
              intakes: m.count || 0,
              conversions: 0, // No real conversion data available
              conversionRate: 0
            }));
          }
        } catch (e) {
          console.log('Could not get trends:', e);
        }
      }

      // Calculate placement rate
      try {
        const placements = await env.DB.prepare(`
          SELECT
            COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
            COUNT(*) as total
          FROM outcomes
        `).first();

        if ((placements as { total: number; placed: number })?.total > 0) {
          const placementData = placements as { total: number; placed: number };
          stats.placementRate = Math.round((placementData.placed / placementData.total) * 100);
        } else {
          stats.placementRate = 0;
        }
      } catch (e) {
        console.log('Could not get placement rate:', e);
      }

    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue with default values if DB queries fail
    }

    // Return real data only - no mock data

    return Response.json({
      stats,
      topCarriers,
      trends,
      lastUpdated: new Date().toISOString()
    }, {
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Analytics endpoint error:', error);

    // Return real zeros on error - no mock data
    return Response.json({
      stats: {
        totalIntakes: 0,
        averageFitScore: 0,
        placementRate: 0,
        remainingRecommendations: 0
      },
      topCarriers: [],
      trends: [],
      lastUpdated: new Date().toISOString(),
      error: 'Analytics data temporarily unavailable'
    }, {
      status: 200, // Return 200 to prevent app crashes
      headers: corsHeaders()
    });
  }
});

// Intake submission endpoint
router.post('/api/intake/submit', async (request, env: Env) => {
  try {
    const intake = await request.json();
    const intakeData = intake as any;
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const recommendationId = 'rec-' + Date.now();
    const intakeId = 'intake-' + Date.now();

    // Log the intake for analytics and history tracking
    console.log('Intake submitted:', {
      userId,
      recommendationId,
      intakeId,
      intakeType: intakeData.answers ? 'legacy' : 'orion',
      timestamp: new Date().toISOString(),
    });

    // Store intake in database
    try {
      console.log('Storing intake with userId:', userId, 'intakeId:', intakeId);
      const result = await env.DB.prepare(
        `
            INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
      )
        .bind(
          intakeId,
          'default-tenant', // tenant_id (required field) - use same as existing records
          JSON.stringify(intakeData), // payload_json
          true, // validated
          intakeData.tier2Triggered || false, // tier2_triggered
          new Date().toISOString(), // created_at
          userId, // user_id
        )
        .run();
      console.log('Intake stored successfully:', result);
    } catch (e) {
      console.log('Could not log intake to database:', e);
      console.log('Error details:', e);
    }

    // Generate real recommendations using RAG
    const recommendations = await generateRealRecommendations(intakeData, env);
    console.log('Generated recommendations:', recommendations.length);

    // Store recommendations in database
    if (recommendations && recommendations.length > 0) {
      try {
        console.log('Storing recommendations with userId:', userId, 'intakeId:', intakeId);

        const stmts = recommendations.map((rec) => {
          return env.DB.prepare(
            `
          INSERT INTO recommendations (
            id, intake_id, model_snapshot, fit_json, citations, latency_ms, created_at,
            recommendation_id, user_id, carrier_id, carrier_name, fit_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          ).bind(
            crypto.randomUUID(),
            intakeId, // intake_id (required)
            'llama-3.1-8b-instruct', // model_snapshot
            JSON.stringify(rec), // fit_json (required)
            JSON.stringify(rec.citations || []), // citations (required)
            Date.now() - parseInt(recommendationId.split('-')[1] as string), // latency_ms
            new Date().toISOString(), // created_at
            recommendationId, // recommendation_id
            userId, // user_id
            rec.carrierId || null, // carrier_id (first carrier)
            rec.carrierName || null, // carrier_name (first carrier)
            rec.fitScore || 0,
          );
        });
        const result = await env.DB.batch(stmts);

        console.log('Recommendations stored successfully:', result);
      } catch (e: any) {
        console.log('Could not store recommendations:', e);
      }
    }

    // Calculate summary statistics
    const averageFit =
      recommendations.length > 0
        ? Math.round(recommendations.reduce((sum, r) => sum + (r.fitScore || 0), 0) / recommendations.length)
        : 0;

    const topCarrierId = recommendations.length > 0 ? recommendations[0].carrierId : 'none';

    // Format response in the expected format
    const response = {
      recommendationId,
      status: 'completed',
      intake: intake,
      recommendations: recommendations,
      top: recommendations.slice(0, 1),
      premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(
        1200 + (100 - averageFit) * 10,
      )} for optimal coverage.`,
      summary: {
        averageFit,
        totalCarriersEvaluated: recommendations.length,
        tier2Recommended: averageFit < 70,
        topCarrierId,
        notes:
          recommendations.length > 0
            ? 'Real recommendations generated using RAG system.'
            : 'No carriers found in database.',
      },
      metadata: {
        processingTime: Date.now() - parseInt(recommendationId.split('-')[1]),
        ragQueriesCount: 0, // No manual RAG queries
        citationsFound: recommendations.reduce((sum, r) => sum + (r.citations?.length || 0), 0),
        modelUsed: 'llama-3.1-8b-instruct',
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Returning response with', recommendations.length, 'recommendations');
    return Response.json(response, { headers: corsHeaders() });
  } catch (error) {
    console.error('Intake submission error:', error);
    return Response.json(
      { error: 'Failed to process intake' },
      { status: 500, headers: corsHeaders() }
    );
  }
});

// Get user history
router.get('/api/user/:userId/history', async (request, env: Env) => {
  const { userId } = request.params;

  try {
    const history = [];

    // Get user's intakes and recommendations in one query
    const dbresults = await env.DB.prepare(
      `
      SELECT
        i.id as intake_id,
        i.created_at as intake_timestamp,
        i.payload_json as intake_data,
        r.recommendation_id,
        r.created_at as recommendation_timestamp,
        r.fit_json,
        r.carrier_name,
        r.fit_score
      FROM intakes i
      LEFT JOIN recommendations r ON i.id = r.intake_id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      `,
    )
      .bind(userId)
      .all();

    if (dbresults?.results) {
      const recommendationGroups: Record<string, any> = {};

      // Process all db results
      for (const row of dbresults.results) {
        const recommendationId = row.recommendation_id as string;
        if (recommendationId) {
          if (!recommendationGroups[recommendationId]) {
            recommendationGroups[recommendationId] = {
              id: recommendationId,
              timestamp: row.recommendation_timestamp,
              type: 'recommendation',
              carriers: [],
              intakeId: row.intake_id,
              intakeTimestamp: row.intake_timestamp,
              intakeData: row.intake_data ? JSON.parse(row.intake_data as string) : null,
            };
          }
          let fitJson = {};
          try {
            fitJson = JSON.parse(row.fit_json as string);
          } catch (e) {
            // ignore
          }

          recommendationGroups[recommendationId].carriers.push({
            carrierName: row.carrier_name,
            fitScore: row.fit_score,
            ...fitJson,
          });
        }
      }

      const processedIntakeIds = new Set();
      for (const rec of Object.values(recommendationGroups)) {
        const topCarrier = rec.carriers.sort((a: any, b: any) => b.fitScore - a.fitScore)[0];
        history.push({
          id: rec.id,
          timestamp: rec.timestamp,
          type: 'recommendation',
          title: `${topCarrier?.carrierName} - ${topCarrier?.fitScore}% fit (${rec.carriers.length} carriers)`,
          score: topCarrier?.fitScore,
          intakeData: rec.intakeData,
        });
        processedIntakeIds.add(rec.intakeId);
      }

      // Add intakes that don't have recommendations
      for (const row of dbresults.results) {
        if (!processedIntakeIds.has(row.intake_id)) {
          history.push({
            id: row.intake_id as string,
            timestamp: row.intake_timestamp as string,
            type: 'intake',
            title: 'Intake submitted',
            score: null,
            intakeData: row.intake_data ? JSON.parse(row.intake_data as string) : null,
          });
          processedIntakeIds.add(row.intake_id); // Avoid duplicates
        }
      }
    }

    // Sort by timestamp (newest first)
    history.sort((a: any, b: any) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

    console.log('Returning history with', history.length, 'items');
    return Response.json(history.slice(0, 50), { headers: corsHeaders() });
  } catch (error) {
    console.error('History endpoint error:', error);
    return Response.json(
      { error: 'Failed to fetch history' },
      { status: 500, headers: corsHeaders() }
    );
  }
});

// Clear user history endpoint
router.delete('/api/user/:userId/history', async (request, env: Env) => {
  const { userId } = request.params;

  try {
    console.log('Clearing history for user:', userId);
    
    // Delete from all relevant tables
    await env.DB.prepare(`
      DELETE FROM recommendations WHERE user_id = ?
    `).bind(userId).run();
    
    await env.DB.prepare(`
      DELETE FROM intakes WHERE user_id = ?
    `).bind(userId).run();
    
    await env.DB.prepare(`
      DELETE FROM intake_submissions WHERE user_id = ?
    `).bind(userId).run();
    
    console.log('History cleared successfully for user:', userId);
    return Response.json({ success: true, message: 'History cleared successfully' }, { 
      headers: corsHeaders() 
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    return Response.json({ error: 'Failed to clear history' }, { 
      status: 500, 
      headers: corsHeaders() 
    });
  }
});

// Get recommendation by ID
router.get('/api/recommendations/:id', async (request, env: Env) => {
  const { id } = request.params;
  const userId = request.headers.get('X-User-Id');

  try {
    console.log('Fetching recommendation:', id, 'for user:', userId);

    // Get recommendation data from database
    const recs = await env.DB.prepare(
      `
              SELECT * FROM recommendations
              WHERE recommendation_id = ?
            `,
    )
      .bind(id)
      .all();

    if (recs?.results && recs.results.length > 0) {
      // Parse the stored recommendation data
      const recommendations = recs.results.map((storedData: any) => {
        try {
          return JSON.parse(storedData.fit_json);
        } catch (e) {
          return null;
        }
      });

      const averageFit =
        recommendations.length > 0
          ? Math.round(recommendations.reduce((sum: number, r: any) => sum + (r?.fitScore || 0), 0) / recommendations.length)
          : 0;

      const topCarrier = recommendations.sort((a: any, b: any) => (b?.fitScore || 0) - (a?.fitScore || 0))[0];

      return Response.json(
        {
          recommendationId: id,
          status: 'completed',
          recommendations,
          top: topCarrier ? [topCarrier] : [],
          premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(
            1200 + (100 - averageFit) * 10,
          )} for optimal coverage.`,
          summary: {
            averageFit,
            totalCarriersEvaluated: recommendations.length,
            tier2Recommended: averageFit < 70,
            topCarrierId: topCarrier?.carrierId || 'none',
            notes: 'Recommendation retrieved from database.',
          },
          metadata: {
            processingTime: (recs.results[0] as any).latency_ms || 0,
            citationsFound: recommendations.reduce((sum: number, r: any) => sum + (r?.citations?.length || 0), 0),
            modelUsed: (recs.results[0] as any).model_snapshot || 'llama-3.1-8b-instruct',
          },
          timestamp: (recs.results[0] as any).created_at,
        },
        { headers: corsHeaders() },
      );
    } else {
      return Response.json({ error: 'Recommendation not found', recommendationId: id }, { status: 404, headers: corsHeaders() });
    }
  } catch (error) {
    console.error('Recommendation retrieval error:', error);
    return Response.json(
      {
        error: 'Failed to retrieve recommendation',
        message: (error as Error).message,
      },
      { status: 500, headers: corsHeaders() },
    );
  }
});

// NOTE: All billing is handled by Clerk Billing
// Clerk automatically handles:
// - Stripe integration and webhook processing
// - Subscription status syncing to user/org metadata
// - Payment processing and invoicing
//
// To configure billing:
// 1. Go to Clerk Dashboard > Billing Settings
// 2. Create subscription plans
// 3. Use <PricingTable /> component in your React app
// 4. Check access with has({ plan: 'plan_name' }) or <Protect> component

// Utility function to extract carrier info from filename
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

// Function to populate carriers table from existing documents
async function populateCarriersFromDocuments(env: Env) {
  try {
    // Check if carriers table is empty
    const existingCarriers = await env.DB.prepare('SELECT COUNT(*) as count FROM carriers').first() as { count: number } | null;
    if (existingCarriers && existingCarriers.count > 0) {
      return; // Carriers already populated
    }

    console.log('Populating carriers table from existing documents...');

    // List all documents in R2
    const list = await env.DOCS_BUCKET.list();
    const pdfFiles = list.objects.filter(obj => obj.key.toLowerCase().endsWith('.pdf'));

    const carriersMap = new Map<string, any>();

    // Extract carrier info from each document
    for (const pdfFile of pdfFiles) {
      const carrierInfo = extractCarrierInfo(pdfFile.key);
      
      if (!carriersMap.has(carrierInfo.carrierId)) {
        carriersMap.set(carrierInfo.carrierId, {
          id: carrierInfo.carrierId,
          name: carrierInfo.carrierName,
          am_best: null, // Will be populated later if available
          portal_url: null,
          agent_phone: null,
          preferred_tier_rank: null,
          available_states: JSON.stringify([]),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Insert carriers into database
    for (const carrier of carriersMap.values()) {
      try {
        await env.DB.prepare(`
          INSERT INTO carriers (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          carrier.id,
          carrier.name,
          carrier.am_best,
          carrier.portal_url,
          carrier.agent_phone,
          carrier.preferred_tier_rank,
          carrier.available_states,
          carrier.created_at,
          carrier.updated_at
        ).run();
      } catch (error) {
        console.log(`Carrier ${carrier.id} might already exist, skipping...`);
      }
    }

    console.log(`Populated ${carriersMap.size} carriers from existing documents`);
  } catch (error) {
    console.error('Error populating carriers from documents:', error);
  }
}

// Get carriers with user preferences
router.get('/api/carriers/with-preferences', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get all carriers (without populating first to avoid errors)
    const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY name').all();
    
    // Get user preferences
    const userPreferences = await env.DB.prepare(
      'SELECT carrier_id, enabled FROM user_carrier_preferences WHERE user_id = ?'
    ).bind(userId).all();

    // Get organization settings (if user is in an organization)
    // We'll get the organization ID from the request headers
    const organizationId = request.headers.get('X-Organization-Id');
    
    // Get organization settings if user is in an organization
    let orgSettings = { results: [] as Array<{ carrier_id: string; enabled: boolean }> };
    if (organizationId) {
      orgSettings = await env.DB.prepare(
        'SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?'
      ).bind(organizationId).all() as { results: Array<{ carrier_id: string; enabled: boolean }> };
    }

    const carriersWithPreferences = carriers.results.map((carrier: any) => {
      const userPref = userPreferences.results.find((pref: any) => pref.carrier_id === carrier.id);
      const orgSetting = orgSettings.results.find((setting: any) => setting.carrier_id === carrier.id);
      
      const userEnabled = userPref ? userPref.enabled : true; // Default to enabled
      const organizationEnabled = orgSetting ? orgSetting.enabled : true; // Default to enabled
      const isOrganizationControlled = organizationId && orgSetting && !orgSetting.enabled; // Controlled if org disabled it

      return {
        id: carrier.id,
        name: carrier.name,
        amBest: carrier.am_best,
        portalUrl: carrier.portal_url,
        agentPhone: carrier.agent_phone,
        preferredTierRank: carrier.preferred_tier_rank,
        availableStates: carrier.available_states ? JSON.parse(carrier.available_states) : [],
        userEnabled,
        organizationEnabled,
        isOrganizationControlled
      };
    });

    return Response.json(carriersWithPreferences, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching carriers with preferences:', error);
    return Response.json({ error: 'Failed to fetch carriers' }, { status: 500, headers: corsHeaders() });
  }
});

// Update user carrier preference
router.post('/api/carriers/preferences', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const { carrierId, enabled } = await request.json() as { carrierId: string; enabled: boolean };
    if (!carrierId || typeof enabled !== 'boolean') {
      return Response.json({ error: 'carrierId and enabled are required' }, { status: 400, headers: corsHeaders() });
    }

    // Upsert user preference
    await env.DB.prepare(`
      INSERT INTO user_carrier_preferences (id, user_id, carrier_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, carrier_id) DO UPDATE SET
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      userId,
      carrierId,
      enabled,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating carrier preference:', error);
    return Response.json({ error: 'Failed to update preference' }, { status: 500, headers: corsHeaders() });
  }
});

// Get user documents
router.get('/api/documents/user', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const documents = await env.DB.prepare(`
      SELECT * FROM user_documents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    return Response.json(documents.results, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return Response.json({ error: 'Failed to fetch documents' }, { status: 500, headers: corsHeaders() });
  }
});

// Upload document
router.post('/api/documents/upload', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const formData = await request.formData();
    const carrierId = formData.get('carrierId') as string;
    const carrierName = formData.get('carrierName') as string;
    const title = formData.get('title') as string;
    const file = formData.get('file') as File;
    const docType = formData.get('docType') as string || 'underwriting_guide';
    const effectiveDate = formData.get('effectiveDate') as string;

    if (!carrierId || !carrierName || !title || !file) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['carrierId', 'carrierName', 'title', 'file']
      }, { status: 400, headers: corsHeaders() });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' }, { status: 400, headers: corsHeaders() });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400, headers: corsHeaders() });
    }

    const documentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const r2Key = `user-documents/${userId}/${carrierId}/${createdAt}/${file.name}`;

    // Store file in R2
    const fileBuffer = await file.arrayBuffer();
    await env.DOCS_BUCKET.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Store metadata in database
    await env.DB.prepare(`
      INSERT INTO user_documents (
        id, user_id, carrier_id, title, filename, r2_key, file_size, 
        content_type, doc_type, effective_date, version, processed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      documentId,
      userId,
      carrierId,
      title,
      file.name,
      r2Key,
      file.size,
      file.type,
      docType,
      effectiveDate || new Date().toISOString().split('T')[0],
      '1.0',
      false, // Will be processed later
      createdAt
    ).run();

    return Response.json({
      success: true,
      documentId,
      message: 'Document uploaded successfully'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('Error uploading document:', error);
    return Response.json({ error: 'Failed to upload document' }, { status: 500, headers: corsHeaders() });
  }
});

// Get organization carrier settings (admin only)
router.get('/api/carriers/organization-settings', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get organization ID from headers
    const organizationId = request.headers.get('X-Organization-Id');
    if (!organizationId) {
      return Response.json({ error: 'Organization ID required' }, { status: 400, headers: corsHeaders() });
    }

    // TODO: Verify user is admin in this organization using Clerk
    // For now, we'll allow all authenticated users to access this endpoint
    // In production, you'd verify the user's role in their organization

    // Get all carriers (without populating first to avoid errors)
    const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY name').all();
    
    const orgSettings = await env.DB.prepare(
      'SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?'
    ).bind(organizationId).all();
    
    const carriersWithSettings = carriers.results.map((carrier: any) => {
      const orgSetting = orgSettings.results.find((setting: any) => setting.carrier_id === carrier.id);
      const organizationEnabled = orgSetting ? orgSetting.enabled : true; // Default to enabled

      return {
        id: carrier.id,
        name: carrier.name,
        amBest: carrier.am_best,
        portalUrl: carrier.portal_url,
        agentPhone: carrier.agent_phone,
        preferredTierRank: carrier.preferred_tier_rank,
        availableStates: carrier.available_states ? JSON.parse(carrier.available_states) : [],
        userEnabled: true, // Not relevant for org admin view
        organizationEnabled,
        isOrganizationControlled: true // All carriers in org admin view are org-controlled
      };
    });

    return Response.json(carriersWithSettings, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching organization carrier settings:', error);
    return Response.json({ error: 'Failed to fetch organization settings' }, { status: 500, headers: corsHeaders() });
  }
});

// Update organization carrier setting (admin only)
router.post('/api/carriers/organization-settings', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get organization ID from headers
    const organizationId = request.headers.get('X-Organization-Id');
    if (!organizationId) {
      return Response.json({ error: 'Organization ID required' }, { status: 400, headers: corsHeaders() });
    }

    // TODO: Verify user is admin in this organization using Clerk
    // For now, we'll allow all authenticated users to access this endpoint
    // In production, you'd verify the user's role in their organization

    const { carrierId, enabled } = await request.json() as { carrierId: string; enabled: boolean };
    if (!carrierId || typeof enabled !== 'boolean') {
      return Response.json({ error: 'carrierId and enabled are required' }, { status: 400, headers: corsHeaders() });
    }

    // Upsert organization setting
    await env.DB.prepare(`
      INSERT INTO organization_carrier_settings (id, organization_id, carrier_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(organization_id, carrier_id) DO UPDATE SET
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      organizationId,
      carrierId,
      enabled,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating organization carrier setting:', error);
    return Response.json({ error: 'Failed to update organization setting' }, { status: 500, headers: corsHeaders() });
  }
});

// Clerk webhook endpoint
router.post('/webhook', async (request, env: Env) => {
  // Simple webhook handler that just acknowledges receipt
  return Response.json(
    { received: true },
    { status: 200, headers: corsHeaders() }
  );
});

// Default 404 handler
router.all('*', () => {
  return Response.json(
    { message: 'Not found' },
    { status: 404, headers: corsHeaders() }
  );
});

// Export worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};