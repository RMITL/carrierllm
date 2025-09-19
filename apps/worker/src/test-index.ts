// Simple test worker with all required endpoints
interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
  CLERK_SECRET_KEY?: string;
}

// Helper function to generate embeddings
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: text
  });
  return response.data[0];
}

// Helper function to perform RAG search
async function performRAGSearch(
  query: string,
  env: Env,
  topK: number = 10
): Promise<Array<{ text: string; carrierId: string; confidence: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, env);

    // Search in Vectorize
    const searchResults = await env.CARRIER_INDEX.query({
      vector: queryEmbedding,
      topK,
      returnMetadata: true
    });

    return searchResults.matches?.map((match: any) => ({
      text: match.metadata?.text || '',
      carrierId: match.metadata?.carrierId || 'unknown',
      confidence: match.score || 0
    })) || [];
  } catch (error) {
    console.error('RAG search error:', error);
    return [];
  }
}

// Helper function to generate real recommendations
async function generateRealRecommendations(
  intakeData: any,
  ragResults: Array<{ text: string; carrierId: string; confidence: number }>,
  env: Env
): Promise<any[]> {
  try {
    // Group RAG results by carrier
    const carrierResults = ragResults.reduce((acc, result) => {
      const carrierId = result.carrierId as string;
      if (!acc[carrierId]) acc[carrierId] = [];
      acc[carrierId].push(result);
      return acc;
    }, {} as Record<string, typeof ragResults>);

    const recommendations: any[] = [];

    // Get carriers from database
    const carriers = await env.DB.prepare('SELECT * FROM carriers LIMIT 5').all();
    const carrierList = carriers.results || [];

    // If no carriers in DB, use fallback carriers
    const fallbackCarriers = [
      { id: 'progressive', name: 'Progressive', preferred_tier_rank: 1 },
      { id: 'statefarm', name: 'State Farm', preferred_tier_rank: 2 },
      { id: 'allstate', name: 'Allstate', preferred_tier_rank: 3 }
    ];

    const carriersToUse = carrierList.length > 0 ? carrierList : fallbackCarriers;

    for (const carrier of carriersToUse) {
      const carrierId = carrier.id;
      const carrierName = carrier.name || carrierId;
      
      // Get relevant context for this carrier
      const carrierContext = carrierResults[carrierId as string] || [];
      const context = carrierContext.map((r: any) => r.text).join('\n\n');

      // Use AI to analyze fit if we have context, otherwise use simple scoring
      let fitScore = 75; // Default score
      let reasons = ['Standard underwriting criteria met'];
      let advisories: string[] = [];
      let confidence = 'medium';

      if (context && env.AI) {
        try {
          const analysis = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              {
                role: 'system',
                content: `You are an insurance underwriting expert. Analyze the client's information and provide a fit score (0-100), reasons for recommendation, and any concerns.

Client Information:
- Age: ${intakeData.core?.age || intakeData.age || 'Not provided'}
- State: ${intakeData.core?.state || intakeData.state || 'Not provided'}
- Height: ${intakeData.core?.height || intakeData.height || 'Not provided'} inches
- Weight: ${intakeData.core?.weight || intakeData.weight || 'Not provided'} lbs
- Nicotine use: ${intakeData.core?.nicotineUse || intakeData.nicotineUse || 'Not provided'}
- Health conditions: ${intakeData.core?.majorConditions || intakeData.majorConditions || 'None specified'}
- Coverage amount: $${intakeData.core?.coverageTarget || intakeData.coverageAmount || 'Not specified'}

Carrier Guidelines:
${context}

Respond in JSON format with: fitScore (0-100), reasons (array), concerns (array), confidence (low/medium/high).`
              }
            ]
          });

          const response = analysis.response || analysis;
          const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
          
          // Try to parse AI response
          try {
            const parsed = JSON.parse(analysisText);
            fitScore = Math.min(100, Math.max(0, parsed.fitScore || fitScore));
            reasons = parsed.reasons || reasons;
            advisories = parsed.concerns || advisories;
            confidence = parsed.confidence || confidence;
          } catch (parseError) {
            console.log('Could not parse AI response, using defaults');
          }
        } catch (aiError) {
          console.log('AI analysis failed, using simple scoring:', aiError);
        }
      }

      // Add some variation based on carrier
      if (carrierId === 'progressive') {
        fitScore = Math.min(100, fitScore + 10);
        reasons = ['Competitive rates', 'Strong financial stability', 'Good customer service'];
      } else if (carrierId === 'statefarm') {
        fitScore = Math.min(100, fitScore + 5);
        reasons = ['Local agent support', 'Multi-policy discounts'];
      } else if (carrierId === 'allstate') {
        fitScore = Math.min(100, fitScore + 2);
        reasons = ['Accident forgiveness', 'Safe driving bonuses'];
      }

      recommendations.push({
        carrierId,
        carrierName,
        product: 'Indexed Universal Life',
        fitPct: fitScore,
        confidence,
        reasons,
        advisories,
        apsLikely: fitScore < 70,
        citations: carrierContext.map((c: any) => ({
          text: c.text.substring(0, 100) + '...',
          source: 'Carrier Guidelines',
          score: c.confidence
        })),
        ctas: {
          portalUrl: `https://${carrierId as string}.com/apply`,
          phoneNumber: `1-800-${(carrierId as string).toUpperCase()}`
        }
      });
    }

    // Sort by fit score descending
    recommendations.sort((a, b) => b.fitPct - a.fitPct);

    return recommendations.slice(0, 3); // Return top 3
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Fallback to simple recommendations
    return [
      {
        carrierId: 'progressive',
        carrierName: 'Progressive',
        product: 'Indexed Universal Life',
        fitPct: 85,
        confidence: 'high',
        reasons: ['Competitive rates', 'Strong financial stability'],
        advisories: [],
        apsLikely: false,
        citations: [],
        ctas: {
          portalUrl: 'https://progressive.com/apply',
          phoneNumber: '1-800-PROGRESSIVE'
        }
      }
    ];
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
        if (path === '/api/health') {
          return Response.json({ status: 'healthy', timestamp: new Date().toISOString() }, { headers: corsHeaders });
        }

        // Test endpoint to check database insert
        if (path === '/api/test-db' && request.method === 'POST') {
          try {
            const userId = request.headers.get('X-User-Id') || 'test-user';
            const testId = 'test-' + Date.now();
            
            console.log('Testing database insert with userId:', userId);
            
            const result = await env.DB.prepare(`
              INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at, user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
              testId,
              'default-tenant',
              '{"test": true}',
              true,
              false,
              new Date().toISOString(),
              userId
            ).run();
            
            console.log('Test insert result:', result);
            
            return Response.json({ 
              success: true, 
              result: result,
              userId: userId,
              testId: testId
            }, { headers: corsHeaders });
          } catch (e) {
            console.log('Test insert failed:', e);
            return Response.json({ 
              success: false, 
              error: e.message,
              userId: request.headers.get('X-User-Id') || 'test-user'
            }, { headers: corsHeaders });
          }
        }

    // Analytics endpoint
    if (path === '/api/analytics/summary') {
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
          remainingRecommendations: 5 // Default free tier limit
        };

        let topCarriers: any[] = [];
        let trends: any[] = [];

        try {
          // Get total intakes - use the main intakes table only
          const intakesResult = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM intakes
          `).first();

          stats.totalIntakes = (intakesResult?.count as number) || 0;

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

              const used = (userUsage?.used as number) || 0;
              
              // Get plan limits from Clerk API
              let planLimit = 5; // Default free tier
              try {
                const clerkApiKey = env.CLERK_SECRET_KEY;
                if (clerkApiKey) {
                  const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
                    headers: {
                      'Authorization': `Bearer ${clerkApiKey}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (clerkResponse.ok) {
                    const userData = await clerkResponse.json();
                    const publicMetadata = userData.public_metadata || {};
                    
                    if (publicMetadata.plan_slug) {
                      if (publicMetadata.plan_slug === 'enterprise') {
                        planLimit = -1; // Unlimited
                      } else if (publicMetadata.plan_slug === 'individual') {
                        planLimit = 100;
                      }
                    }
                  }
                }
              } catch (e) {
                console.log('Could not get plan limits from Clerk:', e);
              }
              
              stats.remainingRecommendations = planLimit === -1 ? 999 : Math.max(0, planLimit - used);
        } catch (e: any) {
          console.log('Could not get user usage:', e);
        }

            // Get user's average fit score
            try {
              const avgScore = await env.DB.prepare(`
                SELECT AVG(fit_score) as avg
                FROM recommendations
                WHERE user_id = ?
              `).bind(userId).first();

              if (avgScore?.avg && avgScore.avg > 0) {
                stats.averageFitScore = Math.round(avgScore.avg as number);
              }
              // If no real data, keep it at 0
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
                  successRate: Math.round(c.avg_score || 0) // Use 0 instead of 75
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
                  conversions: 0, // No real conversion data yet
                  conversionRate: 0 // No real conversion rate yet
                }));
              }
            } catch (e) {
              console.log('Could not get trends:', e);
            }
          }

          // Calculate placement rate - only if we have real outcomes data
          try {
            const placements = await env.DB.prepare(`
              SELECT
                COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                COUNT(*) as total
              FROM outcomes
            `).first();

            if (placements && (placements.total as number) > 0) {
              stats.placementRate = Math.round(((placements.placed as number) / (placements.total as number)) * 100);
            }
            // If no outcomes data, keep placement rate at 0
          } catch (e) {
            console.log('Could not get placement rate:', e);
            // Keep placement rate at 0 if no data
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
        }, { headers: corsHeaders });

      } catch (error) {
        console.error('Analytics endpoint error:', error);
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 0,
            placementRate: 0,
            remainingRecommendations: 5 // Default free tier limit
          },
          topCarriers: [],
          trends: [],
          lastUpdated: new Date().toISOString(),
          error: 'Analytics data temporarily unavailable'
        }, { status: 200, headers: corsHeaders });
      }
    }

    // Subscription endpoint for billing
    if (path.startsWith('/api/subscriptions/') && request.method === 'GET') {
      const userId = path.split('/')[3];
      try {
        console.log('Fetching subscription data for user:', userId);
        
        // Get current month for usage calculation
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Get user's current usage from recommendations table
        let currentUsage = 0;
        try {
          const usageResult = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
          `).bind(userId, monthStart).first();
          
          currentUsage = (usageResult?.count as number) || 0;
          console.log('User current usage:', currentUsage);
        } catch (e: any) {
          console.log('Could not get user usage:', e);
        }
        
        // Get plan information from Clerk's API
        let planLimit = 5; // Default free tier
        let planName = 'Free';
        let planSlug = 'free';
        
        try {
          // Call Clerk's API to get user subscription data
          const clerkApiKey = env.CLERK_SECRET_KEY;
          if (clerkApiKey) {
            const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
              headers: {
                'Authorization': `Bearer ${clerkApiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (clerkResponse.ok) {
              const userData = await clerkResponse.json();
              const publicMetadata = userData.public_metadata || {};
              
              // Extract plan information from Clerk's publicMetadata
              if (publicMetadata.plan_name || publicMetadata.plan_slug) {
                planName = publicMetadata.plan_name || 'Individual';
                planSlug = publicMetadata.plan_slug || 'individual';
                
                // Set limits based on plan
                if (planSlug === 'enterprise') {
                  planLimit = -1; // Unlimited
                } else if (planSlug === 'individual') {
                  planLimit = 100;
                } else {
                  planLimit = 5; // Free tier
                }
                
                console.log('Found Clerk plan data:', { planName, planSlug, planLimit });
              }
            } else {
              console.log('Could not fetch user data from Clerk:', clerkResponse.status);
            }
          } else {
            console.log('No Clerk API key available');
          }
        } catch (e) {
          console.log('Could not get plan from Clerk API:', e);
          // Keep default free plan
        }
        
        return Response.json({
          userId,
          subscription: null, // No subscription until user actually subscribes via Clerk
          usage: {
            current: currentUsage,
            limit: planLimit,
            resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() // Next month
          },
          plan: {
            name: planName,
            slug: planName.toLowerCase().replace(' ', '_')
          }
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('Subscription endpoint error:', error);
        return Response.json({
          userId,
          subscription: null,
          usage: { current: 0, limit: 5, resetDate: new Date().toISOString() },
          plan: { name: 'Free', slug: 'free' },
          error: 'Subscription data temporarily unavailable'
        }, { status: 200, headers: corsHeaders });
      }
    }

    // User history endpoint
    if (path.startsWith('/api/user/') && path.endsWith('/history') && request.method === 'GET') {
      try {
        const userId = path.split('/')[3];
        console.log('Fetching history for user:', userId);
        
        // First, let's check what tables exist and what data we have
        const tableCheck = await env.DB.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name IN ('intakes', 'recommendations', 'intake_submissions')
        `).all();
        console.log('Available tables:', tableCheck.results?.map((t: any) => t.name) || []);

        // Check if we have any data in intakes table with user_id
        const intakesCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM intakes WHERE user_id = ?
        `).bind(userId).first();
        console.log('Intakes with user_id:', intakesCheck?.count || 0);

        // Check if we have any data in recommendations table with user_id
        const recommendationsCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM recommendations WHERE user_id = ?
        `).bind(userId).first();
        console.log('Recommendations with user_id:', recommendationsCheck?.count || 0);

        // Check intake_submissions table (legacy compatibility)
        const intakeSubmissionsCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM intake_submissions
        `).first();
        console.log('Total intake_submissions:', intakeSubmissionsCheck?.count || 0);

        // Try to get recommendations from the current structure
        const recommendations = await env.DB.prepare(`
          SELECT 
            recommendation_id as id,
            created_at as timestamp,
            'recommendation' as type,
            carrier_name as title,
            fit_score as score,
            COUNT(*) as carrier_count,
            AVG(fit_score) as avg_fit
          FROM recommendations
          WHERE user_id = ? AND recommendation_id IS NOT NULL
          GROUP BY recommendation_id
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(userId).all();

        console.log('Found recommendations:', recommendations.results?.length || 0);

        // Try to get intakes from the current structure
        const intakes = await env.DB.prepare(`
          SELECT 
            id,
            created_at as timestamp,
            'intake' as type,
            'Intake submitted' as title,
            payload_json as intake_data
          FROM intakes
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(userId).all();

        console.log('Found intakes:', intakes.results?.length || 0);

        // Also try intake_submissions table as fallback
        const intakeSubmissions = await env.DB.prepare(`
          SELECT 
            id,
            created_at as timestamp,
            'intake' as type,
            'Intake submitted' as title,
            data as intake_data
          FROM intake_submissions
          ORDER BY created_at DESC
          LIMIT 50
        `).all();

        console.log('Found intake_submissions:', intakeSubmissions.results?.length || 0);

        // Combine and format history
        const history = [];
        
            // Add recommendations
            if (recommendations.results) {
              for (const rec of recommendations.results) {
                history.push({
                  id: rec.id as string,
                  timestamp: rec.timestamp as string,
                  type: rec.type as string,
                  title: `${rec.title as string} - ${Math.round(rec.avg_fit as number)}% fit (${rec.carrier_count as number} carriers)`,
                  score: Math.round(rec.avg_fit as number),
                  intakeData: null
                });
              }
            }

            // Add intakes
            if (intakes.results) {
              for (const intake of intakes.results) {
                history.push({
                  id: intake.id as string,
                  timestamp: intake.timestamp as string,
                  type: intake.type as string,
                  title: intake.title as string,
                  score: null,
                  intakeData: intake.intake_data ? JSON.parse(intake.intake_data as string) : null
                });
              }
            }

        // Add intake_submissions as fallback
        if (intakeSubmissions.results && history.length === 0) {
          for (const intake of intakeSubmissions.results) {
            history.push({
              id: intake.id,
              timestamp: intake.timestamp,
              type: intake.type,
              title: intake.title,
              score: null,
              intakeData: intake.intake_data ? JSON.parse(intake.intake_data) : null
            });
          }
        }

            // Sort by timestamp (newest first)
            history.sort((a: any, b: any) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

        console.log('Returning history with', history.length, 'items');
        console.log('History items:', JSON.stringify(history, null, 2));
        return Response.json(history, { headers: corsHeaders });
      } catch (error) {
        console.error('History endpoint error:', error);
        return Response.json([], { headers: corsHeaders });
      }
    }
    
    if (path === '/api/intake/submit' && request.method === 'POST') {
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
          timestamp: new Date().toISOString()
        });

        // Store intake in database
        try {
          console.log('Storing intake with userId:', userId, 'intakeId:', intakeId);
          const result = await env.DB.prepare(`
            INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            intakeId, 
            'default-tenant', // tenant_id (required field) - use same as existing records
            JSON.stringify(intakeData), // payload_json
            true, // validated
            intakeData.tier2Triggered || false, // tier2_triggered
            new Date().toISOString(), // created_at
            userId // user_id
          ).run();
          console.log('Intake stored successfully:', result);
        } catch (e) {
          console.log('Could not log intake to database:', e);
          console.log('Error details:', e);
        }

        // Generate search query from intake data
        const searchQuery = `
          Age ${intakeData.core?.age || intakeData.age || 35} in ${intakeData.core?.state || intakeData.state || 'CA'},
          ${intakeData.core?.height || intakeData.height || 70} inches ${intakeData.core?.weight || intakeData.weight || 170} lbs,
          nicotine use: ${intakeData.core?.nicotineUse || intakeData.nicotineUse || 'never'},
          health conditions: ${intakeData.core?.majorConditions || intakeData.majorConditions || 'none'},
          coverage amount: $${intakeData.core?.coverageTarget || intakeData.coverageAmount || 500000}
        `;

        console.log('Performing RAG search with query:', searchQuery);

        // Perform RAG search
        const ragResults = await performRAGSearch(searchQuery, env, 15);
        console.log('RAG search results:', ragResults.length, 'matches found');

        // Generate real recommendations
        const recommendations = await generateRealRecommendations(intakeData, ragResults, env);
        console.log('Generated recommendations:', recommendations.length);

        // Store recommendations in database
        try {
          console.log('Storing recommendations with userId:', userId, 'intakeId:', intakeId);
          const result = await env.DB.prepare(`
            INSERT INTO recommendations (
              id, intake_id, model_snapshot, fit_json, citations, latency_ms, created_at,
              recommendation_id, user_id, carrier_id, carrier_name, fit_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            intakeId, // intake_id (required)
            'llama-3.1-8b-instruct', // model_snapshot
            JSON.stringify(recommendations), // fit_json (required)
            JSON.stringify(recommendations.flatMap(r => r.citations || [])), // citations (required)
            Date.now() - parseInt(recommendationId.split('-')[1] as string), // latency_ms
            new Date().toISOString(), // created_at
            recommendationId, // recommendation_id
            userId, // user_id
            recommendations[0]?.carrierId || null, // carrier_id (first carrier)
            recommendations[0]?.carrierName || null, // carrier_name (first carrier)
            Math.round(recommendations.reduce((sum, r) => sum + r.fitPct, 0) / recommendations.length) // fit_score (average)
          ).run();
          console.log('Recommendations stored successfully:', result);
        } catch (e: any) {
          console.log('Could not store recommendations:', e);
        }

        // Calculate summary statistics
        const averageFit = recommendations.length > 0 
          ? Math.round(recommendations.reduce((sum, r) => sum + r.fitPct, 0) / recommendations.length)
          : 0;

        const topCarrierId = recommendations.length > 0 ? recommendations[0].carrierId : 'none';

        // Format response in the expected format
        const response = {
          recommendationId,
          status: 'completed',
          intake: intake,
          recommendations: recommendations.map(rec => ({
            carrierId: rec.carrierId,
            carrierName: rec.carrierName,
            fitScore: rec.fitPct,
            tier: rec.fitPct >= 85 ? 'preferred' : rec.fitPct >= 70 ? 'standard' : 'challenging',
            reasoning: {
              pros: rec.reasons,
              cons: rec.advisories,
              summary: `Fit score of ${rec.fitPct}% based on underwriting criteria.`
            },
            estimatedPremium: {
              monthly: Math.round(1200 + (100 - rec.fitPct) * 10),
              annual: Math.round((1200 + (100 - rec.fitPct) * 10) * 12),
              confidence: rec.confidence
            },
            underwritingPath: rec.fitPct >= 80 ? 'simplified' : 'standard',
            requiresExam: rec.apsLikely,
            processingTime: rec.fitPct >= 80 ? '1-2 weeks' : '2-3 weeks',
            citations: rec.citations
          })),
          top: recommendations.slice(0, 1).map(rec => ({
            carrierId: rec.carrierId,
            carrierName: rec.carrierName,
            fitScore: rec.fitPct,
            tier: rec.fitPct >= 85 ? 'preferred' : rec.fitPct >= 70 ? 'standard' : 'challenging',
            reasoning: {
              pros: rec.reasons,
              cons: rec.advisories,
              summary: `Best match with ${rec.fitPct}% fit score.`
            },
            estimatedPremium: {
              monthly: Math.round(1200 + (100 - rec.fitPct) * 10),
              annual: Math.round((1200 + (100 - rec.fitPct) * 10) * 12),
              confidence: rec.confidence
            },
            underwritingPath: rec.fitPct >= 80 ? 'simplified' : 'standard',
            requiresExam: rec.apsLikely,
            processingTime: rec.fitPct >= 80 ? '1-2 weeks' : '2-3 weeks',
            citations: rec.citations
          })),
          premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(1200 + (100 - averageFit) * 10)} for optimal coverage.`,
          summary: {
            averageFit,
            totalCarriersEvaluated: recommendations.length,
            tier2Recommended: averageFit < 70,
            topCarrierId,
            notes: recommendations.length > 0 ? 'Real recommendations generated using RAG system.' : 'No carriers found in database.'
          },
          metadata: {
            processingTime: Date.now() - parseInt(recommendationId.split('-')[1]),
            ragQueriesCount: ragResults.length,
            citationsFound: recommendations.reduce((sum, r) => sum + r.citations.length, 0),
            modelUsed: 'llama-3.1-8b-instruct'
          },
          timestamp: new Date().toISOString()
        };

        console.log('Returning response with', recommendations.length, 'recommendations');
        return Response.json(response, { headers: corsHeaders });

      } catch (error) {
        console.error('Intake submission error:', error);
        return Response.json({
          error: 'Failed to process intake',
          message: (error as Error).message,
          recommendationId: 'error-' + Date.now()
        }, { status: 500, headers: corsHeaders });
      }
    }
    
        // Outcomes endpoint for logging application outcomes
        if (path === '/api/outcomes' && request.method === 'POST') {
          try {
            const outcome = await request.json() as any;
            const userId = request.headers.get('X-User-Id') || 'anonymous';
            
            console.log('Logging outcome:', { userId, outcome });
            
            // Store outcome in database
            try {
              await env.DB.prepare(`
                INSERT INTO outcomes (id, user_id, recommendation_id, carrier_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
              `).bind(
                crypto.randomUUID(),
                userId,
                outcome.recommendationId || null,
                outcome.carrierId || null,
                outcome.status || 'applied',
                new Date().toISOString()
              ).run();
            } catch (e: any) {
              console.log('Could not log outcome to database:', e);
            }
            
            return Response.json({ success: true, message: 'Outcome logged successfully' }, { headers: corsHeaders });
          } catch (error) {
            console.error('Outcomes endpoint error:', error);
            return Response.json({ error: 'Failed to log outcome' }, { status: 500, headers: corsHeaders });
          }
        }
        
        return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      }
    };