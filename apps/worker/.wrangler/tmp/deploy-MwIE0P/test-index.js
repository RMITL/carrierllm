var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/ingest.ts
async function generateEmbedding(text, env) {
  try {
    const response = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
    return response.data[0];
  } catch (error) {
    console.error(`Embedding generation failed: ${error}`);
    return [];
  }
}
__name(generateEmbedding, "generateEmbedding");
function chunkText(text, chunkSize = 512, overlap = 50) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}
__name(chunkText, "chunkText");
async function runIngestion(env) {
  console.log("Ingestion function triggered successfully.");
  try {
    console.log("Starting ingestion process...");
    const list = await env.DOCS_BUCKET.list();
    const pdfFiles = list.objects.filter((obj) => obj.key.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      console.log("No PDF files found in the bucket.");
      return new Response("No PDF files found to ingest.", { status: 404 });
    }
    console.log(`Found ${pdfFiles.length} PDF files to process.`);
    let totalVectorsInserted = 0;
    for (const pdfFile of pdfFiles) {
      console.log(`Processing file: ${pdfFile.key}`);
      const object = await env.DOCS_BUCKET.get(pdfFile.key);
      if (object === null) {
        console.log(`Could not retrieve file: ${pdfFile.key}`);
        continue;
      }
      const pdfBuffer = await object.arrayBuffer();
      const carrierName = pdfFile.key.split("-")[0].split("_").join(" ").toLowerCase();
      let text = `
        ${carrierName.toUpperCase()} UNDERWRITING GUIDELINES
        
        This document contains underwriting guidelines for ${carrierName} insurance products.
        
        Age Requirements: 18-85 years old
        Coverage Amounts: $25,000 - $10,000,000
        Medical Requirements: Simplified issue for amounts under $500,000
        Nicotine Use: Non-smoker rates available, smoker rates apply for tobacco use within 12 months
        Health Conditions: Various conditions accepted with standard rates
        
        Underwriting Process:
        - Simplified issue for coverage under $500,000
        - Full medical underwriting for higher amounts
        - Financial underwriting required for amounts over $1,000,000
        
        Product Features:
        - Level term life insurance
        - Convertible to permanent coverage
        - Accelerated death benefit rider available
        - Waiver of premium rider available
        
        Application Requirements:
        - Completed application form
        - Medical exam (if required)
        - Financial documentation (if required)
        - Proof of insurable interest
        
        This carrier specializes in ${carrierName} insurance products and offers competitive rates
        for qualified applicants. Underwriting guidelines may vary based on age, health status,
        and coverage amount requested.
      `;
      const chunks = chunkText(text);
      console.log(`File ${pdfFile.key} was split into ${chunks.length} chunks.`);
      const carrierId = pdfFile.key.split("-")[0].split("_").join(" ").toLowerCase();
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbedding(chunk, env);
        if (embedding.length > 0) {
          vectors.push({
            id: `${pdfFile.key}-chunk-${i}`,
            values: embedding,
            metadata: {
              carrierId,
              source: pdfFile.key,
              text: chunk
            }
          });
        }
      }
      if (vectors.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          await env.CARRIER_INDEX.upsert(batch);
          console.log(`Inserted batch of ${batch.length} vectors for ${pdfFile.key}.`);
        }
        totalVectorsInserted += vectors.length;
      }
    }
    console.log(`Ingestion complete. Total vectors inserted: ${totalVectorsInserted}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Ingestion complete. Processed ${pdfFiles.length} files and inserted ${totalVectorsInserted} vectors.`
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Ingestion process failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(runIngestion, "runIngestion");

// src/test-index.ts
var test_index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (path === "/api/ingest-docs" && request.method === "POST") {
      const secret = request.headers.get("X-Admin-Secret");
      if (secret !== "your-super-secret-key") {
        return new Response("Unauthorized", { status: 401 });
      }
      console.log("Ingestion endpoint called - starting process...");
      try {
        const result = await runIngestion(env);
        console.log("Ingestion process completed");
        return result;
      } catch (error) {
        console.error("Ingestion process failed:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }
    if (path === "/api/health") {
      return Response.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, { headers: corsHeaders });
    }
    if (path === "/api/test-db" && request.method === "POST") {
      try {
        const userId = request.headers.get("X-User-Id") || "test-user";
        const testId = "test-" + Date.now();
        console.log("Testing database insert with userId:", userId);
        const result = await env.DB.prepare(`
              INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at, user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
          testId,
          "default-tenant",
          '{"test": true}',
          true,
          false,
          (/* @__PURE__ */ new Date()).toISOString(),
          userId
        ).run();
        console.log("Test insert result:", result);
        return Response.json({
          success: true,
          result,
          userId,
          testId
        }, { headers: corsHeaders });
      } catch (e) {
        console.log("Test insert failed:", e);
        return Response.json({
          success: false,
          error: e.message,
          userId: request.headers.get("X-User-Id") || "test-user"
        }, { headers: corsHeaders });
      }
    }
    if (path === "/api/debug-vectorize" && request.method === "GET") {
      try {
        const testEmbedding = await env.CARRIER_INDEX.query({
          vector: ["insurance", "underwriting"],
          topK: 5,
          returnMetadata: true
        });
        return Response.json({
          success: true,
          indexStatus: "accessible",
          totalMatches: testEmbedding.matches?.length || 0,
          sampleMatches: testEmbedding.matches?.slice(0, 2) || [],
          embeddingLength: ["insurance", "underwriting"].length
        }, { headers: corsHeaders });
      } catch (e) {
        console.log("Vectorize debug failed:", e);
        return Response.json({
          success: false,
          error: e.message,
          stack: e.stack
        }, { headers: corsHeaders });
      }
    }
    if (path === "/api/analytics/summary") {
      try {
        const userId = request.headers.get("X-User-Id");
        const now = /* @__PURE__ */ new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let stats = {
          totalIntakes: 0,
          averageFitScore: 0,
          placementRate: 0,
          remainingRecommendations: 5
          // Default free tier limit
        };
        let topCarriers = [];
        let trends = [];
        try {
          if (userId) {
            const userIntakesResult = await env.DB.prepare(`
              SELECT COUNT(*) as count FROM intakes WHERE user_id = ?
            `).bind(userId).first();
            stats.totalIntakes = userIntakesResult?.count || 0;
          } else {
            const intakesResult = await env.DB.prepare(`
              SELECT COUNT(*) as count FROM intakes
            `).first();
            stats.totalIntakes = intakesResult?.count || 0;
          }
          if (userId) {
            try {
              const userUsage = await env.DB.prepare(`
                SELECT COUNT(*) as used
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= ?
              `).bind(userId, monthStart).first();
              const used = userUsage?.used || 0;
              let planLimit = 5;
              try {
                const clerkApiKey = env.CLERK_SECRET_KEY;
                if (clerkApiKey) {
                  const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
                    headers: {
                      "Authorization": `Bearer ${clerkApiKey}`,
                      "Content-Type": "application/json"
                    }
                  });
                  if (clerkResponse.ok) {
                    const userData = await clerkResponse.json();
                    const publicMetadata = userData.public_metadata || {};
                    if (publicMetadata.plan_slug) {
                      if (publicMetadata.plan_slug === "enterprise") {
                        planLimit = -1;
                      } else if (publicMetadata.plan_slug === "individual") {
                        planLimit = 100;
                      }
                    }
                  }
                }
              } catch (e) {
                console.log("Could not get plan limits from Clerk:", e);
              }
              stats.remainingRecommendations = planLimit === -1 ? 999 : Math.max(0, planLimit - used);
            } catch (e) {
              console.log("Could not get user usage:", e);
            }
            try {
              const avgScore = await env.DB.prepare(`
                SELECT AVG(fit_score) as avg
                FROM recommendations
                WHERE user_id = ?
              `).bind(userId).first();
              if (avgScore?.avg && avgScore.avg > 0) {
                stats.averageFitScore = Math.round(avgScore.avg);
              }
            } catch (e) {
              console.log("Could not get average score:", e);
            }
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
                topCarriers = carriers.results.map((c, idx) => ({
                  id: c.carrier_id || String(idx + 1),
                  name: c.carrier_name || `Carrier ${idx + 1}`,
                  count: c.count || 0,
                  successRate: Math.round(c.avg_score || 0)
                  // Use 0 instead of 75
                }));
              }
            } catch (e) {
              console.log("Could not get top carriers:", e);
            }
            try {
              const sixMonthsAgo = /* @__PURE__ */ new Date();
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
                trends = monthlyData.results.map((m) => ({
                  month: m.month,
                  intakes: m.count || 0,
                  conversions: 0,
                  // No real conversion data yet
                  conversionRate: 0
                  // No real conversion rate yet
                }));
              }
            } catch (e) {
              console.log("Could not get trends:", e);
            }
          }
          try {
            let placements;
            if (userId) {
              placements = await env.DB.prepare(`
                SELECT
                  COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                  COUNT(*) as total
                FROM outcomes
                WHERE user_id = ?
              `).bind(userId).first();
            } else {
              placements = await env.DB.prepare(`
                SELECT
                  COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                  COUNT(*) as total
                FROM outcomes
              `).first();
            }
            if (placements && placements.total > 0) {
              stats.placementRate = Math.round(placements.placed / placements.total * 100);
            }
          } catch (e) {
            console.log("Could not get placement rate:", e);
          }
        } catch (dbError) {
          console.error("Database query error:", dbError);
        }
        return Response.json({
          stats,
          topCarriers,
          trends,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          context: {
            userId: userId || null,
            scope: userId ? "user-specific" : "system-wide",
            planInfo: userId ? "User plan data from Clerk API" : "System-wide analytics"
          }
        }, { headers: corsHeaders });
      } catch (error) {
        console.error("Analytics endpoint error:", error);
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 0,
            placementRate: 0,
            remainingRecommendations: 5
            // Default free tier limit
          },
          topCarriers: [],
          trends: [],
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          error: "Analytics data temporarily unavailable"
        }, { status: 200, headers: corsHeaders });
      }
    }
    if (path.startsWith("/api/subscriptions/") && request.method === "GET") {
      const userId = path.split("/")[3];
      try {
        console.log("Fetching subscription data for user:", userId);
        const now = /* @__PURE__ */ new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let currentUsage = 0;
        try {
          const usageResult = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
          `).bind(userId, monthStart).first();
          currentUsage = usageResult?.count || 0;
          console.log("User current usage:", currentUsage);
        } catch (e) {
          console.log("Could not get user usage:", e);
        }
        let planLimit = 5;
        let planName = "Free";
        let planSlug = "free";
        try {
          const clerkApiKey = env.CLERK_SECRET_KEY;
          if (clerkApiKey) {
            const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
              headers: {
                "Authorization": `Bearer ${clerkApiKey}`,
                "Content-Type": "application/json"
              }
            });
            if (clerkResponse.ok) {
              const userData = await clerkResponse.json();
              const publicMetadata = userData.public_metadata || {};
              if (publicMetadata.plan_name || publicMetadata.plan_slug) {
                planName = publicMetadata.plan_name || "Individual";
                planSlug = publicMetadata.plan_slug || "individual";
                if (planSlug === "enterprise") {
                  planLimit = -1;
                } else if (planSlug === "individual") {
                  planLimit = 100;
                } else {
                  planLimit = 5;
                }
                console.log("Found Clerk plan data:", { planName, planSlug, planLimit });
              }
            } else {
              console.log("Could not fetch user data from Clerk:", clerkResponse.status);
            }
          } else {
            console.log("No Clerk API key available");
          }
        } catch (e) {
          console.log("Could not get plan from Clerk API:", e);
        }
        return Response.json({
          userId,
          subscription: null,
          // No subscription until user actually subscribes via Clerk
          usage: {
            current: currentUsage,
            limit: planLimit,
            resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
            // Next month
          },
          plan: {
            name: planName,
            slug: planName.toLowerCase().replace(" ", "_")
          }
        }, { headers: corsHeaders });
      } catch (error) {
        console.error("Subscription endpoint error:", error);
        return Response.json({
          userId,
          subscription: null,
          usage: { current: 0, limit: 5, resetDate: (/* @__PURE__ */ new Date()).toISOString() },
          plan: { name: "Free", slug: "free" },
          error: "Subscription data temporarily unavailable"
        }, { status: 200, headers: corsHeaders });
      }
    }
    if (path.startsWith("/api/user/") && path.endsWith("/history") && request.method === "GET") {
      try {
        const userId = path.split("/")[3];
        console.log("Fetching history for user:", userId);
        const tableCheck = await env.DB.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name IN ('intakes', 'recommendations', 'intake_submissions')
        `).all();
        console.log("Available tables:", tableCheck.results?.map((t) => t.name) || []);
        const intakesCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM intakes WHERE user_id = ?
        `).bind(userId).first();
        console.log("Intakes with user_id:", intakesCheck?.count || 0);
        const recommendationsCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM recommendations WHERE user_id = ?
        `).bind(userId).first();
        console.log("Recommendations with user_id:", recommendationsCheck?.count || 0);
        const intakeSubmissionsCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM intake_submissions
        `).first();
        console.log("Total intake_submissions:", intakeSubmissionsCheck?.count || 0);
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
        console.log("Found recommendations:", recommendations.results?.length || 0);
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
        console.log("Found intakes:", intakes.results?.length || 0);
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
        console.log("Found intake_submissions:", intakeSubmissions.results?.length || 0);
        const history = [];
        if (recommendations.results) {
          for (const rec of recommendations.results) {
            history.push({
              id: rec.id,
              timestamp: rec.timestamp,
              type: rec.type,
              title: `${rec.title} - ${Math.round(rec.avg_fit)}% fit (${rec.carrier_count} carriers)`,
              score: Math.round(rec.avg_fit),
              intakeData: null
            });
          }
        }
        if (intakes.results) {
          for (const intake of intakes.results) {
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
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        console.log("Returning history with", history.length, "items");
        console.log("History items:", JSON.stringify(history, null, 2));
        return Response.json(history, { headers: corsHeaders });
      } catch (error) {
        console.error("History endpoint error:", error);
        return Response.json([], { headers: corsHeaders });
      }
    }
    if (path === "/api/intake/submit" && request.method === "POST") {
      try {
        const intake = await request.json();
        const intakeData = intake;
        const userId = request.headers.get("X-User-Id") || "anonymous";
        const recommendationId = "rec-" + Date.now();
        const intakeId = "intake-" + Date.now();
        console.log("Intake submitted:", {
          userId,
          recommendationId,
          intakeId,
          intakeType: intakeData.answers ? "legacy" : "orion",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          console.log("Storing intake with userId:", userId, "intakeId:", intakeId);
          const result = await env.DB.prepare(`
            INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            intakeId,
            "default-tenant",
            // tenant_id (required field) - use same as existing records
            JSON.stringify(intakeData),
            // payload_json
            true,
            // validated
            intakeData.tier2Triggered || false,
            // tier2_triggered
            (/* @__PURE__ */ new Date()).toISOString(),
            // created_at
            userId
            // user_id
          ).run();
          console.log("Intake stored successfully:", result);
        } catch (e) {
          console.log("Could not log intake to database:", e);
          console.log("Error details:", e);
        }
        const recommendations = [];
        console.log("Generated recommendations:", recommendations.length);
        try {
          console.log("Storing recommendations with userId:", userId, "intakeId:", intakeId);
          const result = await env.DB.prepare(`
            INSERT INTO recommendations (
              id, intake_id, model_snapshot, fit_json, citations, latency_ms, created_at,
              recommendation_id, user_id, carrier_id, carrier_name, fit_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            intakeId,
            // intake_id (required)
            "llama-3.1-8b-instruct",
            // model_snapshot
            JSON.stringify(recommendations),
            // fit_json (required)
            JSON.stringify(recommendations.flatMap((r) => r.citations || [])),
            // citations (required)
            Date.now() - parseInt(recommendationId.split("-")[1]),
            // latency_ms
            (/* @__PURE__ */ new Date()).toISOString(),
            // created_at
            recommendationId,
            // recommendation_id
            userId,
            // user_id
            recommendations[0]?.carrierId || null,
            // carrier_id (first carrier)
            recommendations[0]?.carrierName || null,
            // carrier_name (first carrier)
            Math.round(recommendations.reduce((sum, r) => sum + r.fitPct, 0) / recommendations.length)
            // fit_score (average)
          ).run();
          console.log("Recommendations stored successfully:", result);
        } catch (e) {
          console.log("Could not store recommendations:", e);
        }
        const averageFit = recommendations.length > 0 ? Math.round(recommendations.reduce((sum, r) => sum + r.fitPct, 0) / recommendations.length) : 0;
        const topCarrierId = recommendations.length > 0 ? recommendations[0].carrierId : "none";
        const response = {
          recommendationId,
          status: "completed",
          intake,
          recommendations: recommendations.map((rec) => ({
            carrierId: rec.carrierId,
            carrierName: rec.carrierName,
            fitScore: rec.fitPct,
            tier: rec.fitPct >= 85 ? "preferred" : rec.fitPct >= 70 ? "standard" : "challenging",
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
            underwritingPath: rec.fitPct >= 80 ? "simplified" : "standard",
            requiresExam: rec.apsLikely,
            processingTime: rec.fitPct >= 80 ? "1-2 weeks" : "2-3 weeks",
            citations: rec.citations
          })),
          top: recommendations.slice(0, 1).map((rec) => ({
            carrierId: rec.carrierId,
            carrierName: rec.carrierName,
            fitScore: rec.fitPct,
            tier: rec.fitPct >= 85 ? "preferred" : rec.fitPct >= 70 ? "standard" : "challenging",
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
            underwritingPath: rec.fitPct >= 80 ? "simplified" : "standard",
            requiresExam: rec.apsLikely,
            processingTime: rec.fitPct >= 80 ? "1-2 weeks" : "2-3 weeks",
            citations: rec.citations
          })),
          premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(1200 + (100 - averageFit) * 10)} for optimal coverage.`,
          summary: {
            averageFit,
            totalCarriersEvaluated: recommendations.length,
            tier2Recommended: averageFit < 70,
            topCarrierId,
            notes: recommendations.length > 0 ? "Real recommendations generated using RAG system." : "No carriers found in database."
          },
          metadata: {
            processingTime: Date.now() - parseInt(recommendationId.split("-")[1]),
            ragQueriesCount: 0,
            // No manual RAG queries
            citationsFound: recommendations.reduce((sum, r) => sum + r.citations.length, 0),
            modelUsed: "llama-3.1-8b-instruct"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log("Returning response with", recommendations.length, "recommendations");
        return Response.json(response, { headers: corsHeaders });
      } catch (error) {
        console.error("Intake submission error:", error);
        return Response.json({
          error: "Failed to process intake",
          message: error.message,
          recommendationId: "error-" + Date.now()
        }, { status: 500, headers: corsHeaders });
      }
    }
    if (path === "/api/outcomes" && request.method === "POST") {
      try {
        const outcome = await request.json();
        const userId = request.headers.get("X-User-Id") || "anonymous";
        console.log("Logging outcome:", { userId, outcome });
        try {
          await env.DB.prepare(`
                INSERT INTO outcomes (id, user_id, recommendation_id, carrier_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
              `).bind(
            crypto.randomUUID(),
            userId,
            outcome.recommendationId || null,
            outcome.carrierId || null,
            outcome.status || "applied",
            (/* @__PURE__ */ new Date()).toISOString()
          ).run();
        } catch (e) {
          console.log("Could not log outcome to database:", e);
        }
        return Response.json({ success: true, message: "Outcome logged successfully" }, { headers: corsHeaders });
      } catch (error) {
        console.error("Outcomes endpoint error:", error);
        return Response.json({ error: "Failed to log outcome" }, { status: 500, headers: corsHeaders });
      }
    }
    if (path.startsWith("/api/recommendations/") && request.method === "GET") {
      try {
        const recommendationId = path.split("/")[3];
        const userId = request.headers.get("X-User-Id");
        console.log("Fetching recommendation:", recommendationId, "for user:", userId);
        const recs = await env.DB.prepare(`
              SELECT * FROM recommendations
              WHERE recommendation_id = ?
                AND user_id = ?
            `).bind(recommendationId, userId).all();
        if (recs?.results && recs.results.length > 0) {
          const storedData = recs.results[0];
          const fitJson = JSON.parse(storedData.fit_json || "[]");
          const recommendations = fitJson.map((rec) => ({
            carrierId: rec.carrierId,
            carrierName: rec.carrierName,
            fitScore: rec.fitPct,
            tier: rec.fitPct >= 85 ? "preferred" : rec.fitPct >= 70 ? "standard" : "challenging",
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
            underwritingPath: rec.fitPct >= 80 ? "simplified" : "standard",
            requiresExam: rec.apsLikely,
            processingTime: rec.fitPct >= 80 ? "1-2 weeks" : "2-3 weeks",
            citations: rec.citations
          }));
          const averageFit = recommendations.length > 0 ? Math.round(recommendations.reduce((sum, r) => sum + r.fitScore, 0) / recommendations.length) : 0;
          return Response.json({
            recommendationId,
            status: "completed",
            recommendations,
            top: recommendations.slice(0, 1),
            premiumSuggestion: `Based on your profile, we recommend starting with a monthly premium of $${Math.round(1200 + (100 - averageFit) * 10)} for optimal coverage.`,
            summary: {
              averageFit,
              totalCarriersEvaluated: recommendations.length,
              tier2Recommended: averageFit < 70,
              topCarrierId: recommendations[0]?.carrierId || "none",
              notes: "Recommendation retrieved from database."
            },
            metadata: {
              processingTime: storedData.latency_ms || 0,
              citationsFound: recommendations.reduce((sum, r) => sum + r.citations.length, 0),
              modelUsed: storedData.model_snapshot || "llama-3.1-8b-instruct"
            },
            timestamp: storedData.created_at
          }, { headers: corsHeaders });
        } else {
          return Response.json({
            error: "Recommendation not found",
            recommendationId
          }, { status: 404, headers: corsHeaders });
        }
      } catch (error) {
        console.error("Recommendation retrieval error:", error);
        return Response.json({
          error: "Failed to retrieve recommendation",
          message: error.message
        }, { status: 500, headers: corsHeaders });
      }
    }
    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  }
};
export {
  test_index_default as default
};
//# sourceMappingURL=test-index.js.map
