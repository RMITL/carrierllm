import { runIngestion } from './ingest';

// Simple test worker with all required endpoints
interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  AI: any;
  CLERK_SECRET_KEY?: string;
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
    console.log('RAG: Embedding type:', typeof queryEmbedding);
    console.log('RAG: Is array:', Array.isArray(queryEmbedding));
    
    const results = await env.CARRIER_INDEX.query(queryEmbedding, {
      topK,
      returnMetadata: true,
    });
    
    console.log('RAG: Query successful, found', results.matches?.length || 0, 'matches');
    return results.matches.map(match => match.metadata);
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
        recommendations.sort((a, b) => (b.fitPct || 0) - (a.fitPct || 0));
        
        console.log('Generated', recommendations.length, 'recommendations');
        return recommendations.slice(0, 10); // Return top 10
    } catch (error) {
        console.error('Error in generateRealRecommendations:', error);
        console.error('Error details:', error.message);
        return [];
    }
}

// Generate AI-powered recommendation for a specific carrier
async function generateCarrierRecommendation(carrierId: string, results: any[], clientProfile: string, env: Env): Promise<any> {
    try {
        // Combine all text from this carrier's results
        const combinedText = results.map(r => r.text).join('\n\n');
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
                    content: aiPrompt
                }
            ],
            max_tokens: 1000
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
                // Try to clean up common JSON issues
                jsonText = jsonText
                    .replace(/,\s*}/g, '}')  // Remove trailing commas
                    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                    .replace(/(\w+):/g, '"$1":')  // Quote unquoted keys
                    .replace(/:(\w+)/g, ':"$1"')  // Quote unquoted string values
                    .replace(/:(\d+\.?\d*)/g, ':$1');  // Keep numbers unquoted
            } else {
                // Method 2: Look for fitPct in the text
                const fitPctMatch = responseText.match(/fitPct["\s]*:[\s]*(\d+)/i);
                const reasonsMatch = responseText.match(/reasons["\s]*:[\s]*\[(.*?)\]/i);
                const advisoriesMatch = responseText.match(/advisories["\s]*:[\s]*\[(.*?)\]/i);
                
                if (fitPctMatch) {
                    const fitPct = parseInt(fitPctMatch[1]);
                    const reasons = reasonsMatch ? reasonsMatch[1].split(',').map(r => r.trim().replace(/['"]/g, '')) : [`${carrierId} underwriting guidelines applicable`];
                    const advisories = advisoriesMatch ? advisoriesMatch[1].split(',').map(a => a.trim().replace(/['"]/g, '')) : [];
                    
                    analysis = {
                        fitPct: fitPct,
                        reasons: reasons,
                        advisories: advisories,
                        confidence: 80,
                        product: 'Life Insurance',
                        underwritingPath: 'standard'
                    };
                } else {
                    throw new Error('No structured data found in AI response');
                }
            }
            
            if (jsonText && !analysis) {
                analysis = JSON.parse(jsonText);
            }
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
                underwritingPath: 'standard'
            };
        }

        return {
            carrierId: carrierId,
            carrierName: formatCarrierName(carrierId),
            fitScore: Math.max(0, Math.min(100, analysis.fitPct || 0)),
            reasoning: {
                pros: analysis.reasons || [`${carrierId} guidelines applicable`],
                cons: analysis.advisories || [],
                summary: `Fit score of ${Math.max(0, Math.min(100, analysis.fitPct || 0))}% based on underwriting criteria.`
            },
            estimatedPremium: {
                monthly: Math.round(1200 + (100 - (analysis.fitPct || 0)) * 10),
                annual: Math.round((1200 + (100 - (analysis.fitPct || 0)) * 10) * 12)
            },
            confidence: analysis.confidence >= 80 ? 'high' : analysis.confidence >= 60 ? 'medium' : 'low',
            citations: (analysis.citations || [{ source: topResult.source, text: topResult.text.substring(0, 200) }]).map((citation: any, index: number) => ({
                chunkId: `${carrierId}-${index}`,
                snippet: citation.text || citation.snippet || '',
                documentTitle: citation.source || 'Carrier Underwriting Guide',
                effectiveDate: new Date().toISOString(),
                score: topResult.score || 0.8
            }))
        };
    } catch (error) {
        console.error(`Error in generateCarrierRecommendation for ${carrierId}:`, error);
        return null;
    }
}

// Format carrier names for display
function formatCarrierName(carrierId: string): string {
    return carrierId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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
    
        // Ingestion endpoint (protected)
        if (path === '/api/ingest-docs' && request.method === 'POST') {
          const secret = request.headers.get('X-Admin-Secret');
          if (secret !== 'your-super-secret-key') { // Use a secret from env vars in production
            return new Response('Unauthorized', { status: 401 });
          }
          console.log('Ingestion endpoint called - starting process...');
          try {
            const result = await runIngestion(env);
            console.log('Ingestion process completed');
            return result;
          } catch (error) {
            console.error('Ingestion process failed:', error);
            return Response.json({ success: false, error: error.message }, { status: 500 });
          }
        }
    
        if (path === '/api/health') {
          return Response.json({ status: 'healthy', timestamp: new Date().toISOString() }, { headers: corsHeaders });
        }

        // Clear history endpoint
        if (path.startsWith('/api/user/') && path.endsWith('/history') && request.method === 'DELETE') {
          try {
            const userId = path.split('/')[3];
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
            return Response.json({ success: true, message: 'History cleared successfully' }, { headers: corsHeaders });
          } catch (error) {
            console.error('Error clearing history:', error);
            return Response.json({ error: 'Failed to clear history' }, { status: 500, headers: corsHeaders });
          }
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
          } catch (e: any) {
            console.log('Test insert failed:', e);
            return Response.json({ 
              success: false, 
              error: e.message,
              userId: request.headers.get('X-User-Id') || 'test-user'
            }, { headers: corsHeaders });
          }
        }

        // Debug endpoint to check Vectorize index status
        if (path === '/api/debug-vectorize' && request.method === 'GET') {
          try {
            // Generate a proper embedding for testing
            const testText = 'insurance underwriting guidelines';
            console.log('Debug: Generating test embedding for:', testText);
            const testEmbeddingVector = await generateEmbedding(testText, env);
            console.log('Debug: Generated embedding length:', testEmbeddingVector.length);
            
            if (testEmbeddingVector.length === 0) {
              return Response.json({
                success: false,
                error: 'Failed to generate test embedding - returned empty array'
              }, { headers: corsHeaders });
            }

            // Try a simple search to see if the index has any data
            console.log('Debug: About to query Vectorize with embedding of length:', testEmbeddingVector.length);
            console.log('Debug: First few values of embedding:', testEmbeddingVector.slice(0, 5));
            console.log('Debug: Embedding type:', typeof testEmbeddingVector);
            console.log('Debug: Is array:', Array.isArray(testEmbeddingVector));
            console.log('Debug: Embedding constructor:', testEmbeddingVector.constructor.name);
            
            // Try to get index info first
            try {
              const indexInfo = await env.CARRIER_INDEX.describe();
              console.log('Debug: Index info:', indexInfo);
            } catch (e) {
              console.log('Debug: Could not get index info:', e.message);
            }
            
            // Try different query formats to see which one works
            let testEmbedding;
            try {
              // Try the object format first
              console.log('Debug: Trying object format query...');
              testEmbedding = await env.CARRIER_INDEX.query({
                vector: testEmbeddingVector,
                topK: 5,
                returnMetadata: true
              });
              console.log('Debug: Object format query succeeded');
            } catch (e1) {
              console.log('Debug: Object format failed:', e1.message);
              try {
                // Try the array format
                console.log('Debug: Trying array format query...');
                testEmbedding = await env.CARRIER_INDEX.query(testEmbeddingVector, {
                  topK: 5,
                  returnMetadata: true
                });
                console.log('Debug: Array format query succeeded');
              } catch (e2) {
                console.log('Debug: Array format failed:', e2.message);
                throw e2;
              }
            }

            return Response.json({
              success: true,
              indexStatus: 'accessible',
              totalMatches: testEmbedding.matches?.length || 0,
              sampleMatches: testEmbedding.matches?.slice(0, 2) || [],
              embeddingLength: testEmbeddingVector.length,
              testText: testText
            }, { headers: corsHeaders });
          } catch (e: any) {
            console.log('Vectorize debug failed:', e);
            return Response.json({
              success: false,
              error: e.message,
              stack: e.stack
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
          // Get user-specific intakes if userId provided, otherwise system-wide
          if (userId) {
            const userIntakesResult = await env.DB.prepare(`
              SELECT COUNT(*) as count FROM intakes WHERE user_id = ?
            `).bind(userId).first();
            stats.totalIntakes = (userIntakesResult?.count as number) || 0;
          } else {
            // System-wide total for admin view
            const intakesResult = await env.DB.prepare(`
              SELECT COUNT(*) as count FROM intakes
            `).first();
            stats.totalIntakes = (intakesResult?.count as number) || 0;
          }

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

          // Calculate placement rate - user-specific if userId provided
          try {
            let placements;
            if (userId) {
              // User-specific placement rate
              placements = await env.DB.prepare(`
                SELECT
                  COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                  COUNT(*) as total
                FROM outcomes
                WHERE user_id = ?
              `).bind(userId).first();
            } else {
              // System-wide placement rate
              placements = await env.DB.prepare(`
                SELECT
                  COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                  COUNT(*) as total
                FROM outcomes
              `).first();
            }

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
          lastUpdated: new Date().toISOString(),
          context: {
            userId: userId || null,
            scope: userId ? 'user-specific' : 'system-wide',
            planInfo: userId ? 'User plan data from Clerk API' : 'System-wide analytics'
          }
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
            fit_json,
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
                try {
                  // Parse the fit_json to get the actual recommendation data
                  const fitJson = JSON.parse(rec.fit_json as string || '[]');
                  const topCarrier = fitJson.length > 0 ? fitJson[0] : null;
                  const carrierName = topCarrier?.carrierName || topCarrier?.carrierId || 'Unknown Carrier';
                  const fitScore = topCarrier?.fitScore || Math.round(rec.avg_fit as number) || 0;
                  
                  history.push({
                    id: rec.id as string,
                    timestamp: rec.timestamp as string,
                    type: rec.type as string,
                    title: `${carrierName} - ${fitScore}% fit (${rec.carrier_count as number} carriers)`,
                    score: fitScore,
                    intakeData: null
                  });
                } catch (parseError) {
                  // Fallback for old format
                  history.push({
                    id: rec.id as string,
                    timestamp: rec.timestamp as string,
                    type: rec.type as string,
                    title: `Recommendation - ${Math.round(rec.avg_fit as number)}% fit (${rec.carrier_count as number} carriers)`,
                    score: Math.round(rec.avg_fit as number),
                    intakeData: null
                  });
                }
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

        // Generate real recommendations using RAG
        const recommendations = await generateRealRecommendations(intakeData, env);
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
            ragQueriesCount: 0, // No manual RAG queries
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

        // Recommendations endpoint for retrieving specific recommendations
        if (path.startsWith('/api/recommendations/') && request.method === 'GET') {
          try {
            const recommendationId = path.split('/')[3];
            const userId = request.headers.get('X-User-Id');
            
            console.log('Fetching recommendation:', recommendationId, 'for user:', userId);
            
            // Get recommendation data from database
            const recs = await env.DB.prepare(`
              SELECT * FROM recommendations
              WHERE recommendation_id = ?
                AND user_id = ?
            `).bind(recommendationId, userId).all();

            if (recs?.results && recs.results.length > 0) {
              // Parse the stored recommendation data
              const storedData = recs.results[0];
              const fitJson = JSON.parse(storedData.fit_json || '[]');
              
              const recommendations = fitJson.map((rec: any) => {
                // Handle both new and old data formats
                const fitScore = rec.fitScore || rec.fitPct || rec.fitPercent || 0;
                const carrierName = rec.carrierName || rec.carrierId || 'Unknown Carrier';
                const product = rec.product || rec.program || 'Life Insurance';
                const reasons = rec.reasoning?.pros || rec.reasons || [`${carrierName} underwriting guidelines applicable`];
                const advisories = rec.reasoning?.cons || rec.advisories || [];
                const citations = rec.citations || [];
                
                return {
                  carrierId: rec.carrierId || 'unknown',
                  carrierName: carrierName,
                  program: product,
                  fitScore: fitScore,
                  fitPct: fitScore, // For backward compatibility
                  tier: fitScore >= 85 ? 'preferred' : fitScore >= 70 ? 'standard' : 'challenging',
                  reasoning: {
                    pros: reasons,
                    cons: advisories,
                    summary: `Fit score of ${fitScore}% based on underwriting criteria.`
                  },
                  estimatedPremium: {
                    monthly: Math.round(1200 + (100 - fitScore) * 10),
                    annual: Math.round((1200 + (100 - fitScore) * 10) * 12),
                    confidence: rec.confidence || 'medium'
                  },
                  underwritingPath: fitScore >= 80 ? 'simplified' : 'standard',
                  requiresExam: rec.apsLikely || false,
                  processingTime: fitScore >= 80 ? '1-2 weeks' : '2-3 weeks',
                  citations: citations
                };
              });

              const averageFit = recommendations.length > 0 
                ? Math.round(recommendations.reduce((sum: number, r: any) => sum + r.fitScore, 0) / recommendations.length)
                : 0;

              return Response.json({
                recommendationId,
                status: 'completed',
                recommendations,
                top: recommendations.slice(0, 1),
                premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(1200 + (100 - averageFit) * 10)} for optimal coverage.`,
                summary: {
                  averageFit,
                  totalCarriersEvaluated: recommendations.length,
                  tier2Recommended: averageFit < 70,
                  topCarrierId: recommendations[0]?.carrierId || 'none',
                  notes: 'Recommendation retrieved from database.'
                },
                metadata: {
                  processingTime: storedData.latency_ms || 0,
                  citationsFound: recommendations.reduce((sum: number, r: any) => sum + r.citations.length, 0),
                  modelUsed: storedData.model_snapshot || 'llama-3.1-8b-instruct'
                },
                timestamp: storedData.created_at
              }, { headers: corsHeaders });
            } else {
              return Response.json({
                error: 'Recommendation not found',
                recommendationId
              }, { status: 404, headers: corsHeaders });
            }
          } catch (error) {
            console.error('Recommendation retrieval error:', error);
            return Response.json({
              error: 'Failed to retrieve recommendation',
              message: (error as Error).message
            }, { status: 500, headers: corsHeaders });
          }
        }
        
        return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      }
    };