var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/production-index.ts
function extractCarrierInfo(filename) {
  const name = filename.replace(".pdf", "").toLowerCase();
  const carrierMappings = {
    "agl": "american-general-life",
    "allianz": "allianz",
    "americo": "americo",
    "columbus": "columbus-life",
    "corbridge": "corbridge",
    "ethos": "ethos",
    "f&g": "fidelity-guarantee",
    "foresters": "foresters",
    "moo": "mutual-of-omaha",
    "plag": "pacific-life",
    "plc": "pacific-life",
    "prudential": "prudential",
    "securian": "securian",
    "symetra": "symetra",
    "transamerica": "transamerica"
  };
  for (const [key, carrierId] of Object.entries(carrierMappings)) {
    if (name.includes(key)) {
      return {
        carrierId,
        carrierName: carrierId.split("-").map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ")
      };
    }
  }
  const firstWord = name.split(/[\s_-]/)[0];
  return {
    carrierId: firstWord.toLowerCase(),
    carrierName: firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  };
}
__name(extractCarrierInfo, "extractCarrierInfo");
async function verifyUserAccess(userId, env) {
  const user = await env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
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
__name(verifyUserAccess, "verifyUserAccess");
async function checkUsageLimits(userProfile) {
  const limits = {
    individual: 200,
    team: 1e3,
    enterprise: 1e4
  };
  const limit = limits[userProfile.subscriptionTier] || 200;
  return userProfile.usageStats.recommendationsUsed < limit;
}
__name(checkUsageLimits, "checkUsageLimits");
async function processDocumentForRAG(documentKey, documentId, env) {
  try {
    const document = await env.DOCS_BUCKET.get(documentKey);
    if (!document) throw new Error("Document not found in R2");
    const chunks = await createDocumentChunks(documentKey, documentId);
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text, env);
      await env.DB.prepare(
        `INSERT INTO chunks (id, document_id, content, chunk_index, embedding_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        chunk.id,
        documentId,
        chunk.text,
        chunk.index,
        chunk.id,
        // Use chunk ID as embedding ID
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
      await env.CARRIER_INDEX.upsert([{
        id: chunk.id,
        values: embedding,
        metadata: {
          documentId,
          chunkIndex: chunk.index,
          carrierId: chunk.carrierId,
          text: chunk.text.substring(0, 500)
          // Store snippet
        }
      }]);
    }
  } catch (error) {
    console.error(`Failed to process document ${documentKey}:`, error);
    throw error;
  }
}
__name(processDocumentForRAG, "processDocumentForRAG");
async function createDocumentChunks(documentKey, documentId) {
  const filename = documentKey.split("/").pop() || documentKey;
  const carrierInfo = extractCarrierInfo(filename);
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
__name(createDocumentChunks, "createDocumentChunks");
async function generateEmbedding(text, env) {
  const response = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [text]
  });
  return response.data[0];
}
__name(generateEmbedding, "generateEmbedding");
async function performRAGSearch(query, env, topK = 10) {
  const queryEmbedding = await generateEmbedding(query, env);
  const searchResults = await env.CARRIER_INDEX.query({
    vector: queryEmbedding,
    topK,
    returnMetadata: true
  });
  return searchResults.matches.map((match) => ({
    text: match.metadata.text,
    carrierId: match.metadata.carrierId,
    confidence: match.score
  }));
}
__name(performRAGSearch, "performRAGSearch");
async function generateRecommendations(intakeData, ragResults, env) {
  const carrierResults = ragResults.reduce((acc, result) => {
    if (!acc[result.carrierId]) acc[result.carrierId] = [];
    acc[result.carrierId].push(result);
    return acc;
  }, {});
  const recommendations = [];
  for (const [carrierId, results] of Object.entries(carrierResults)) {
    const carrier = await env.DB.prepare(
      "SELECT * FROM carriers WHERE id = ?"
    ).bind(carrierId).first();
    if (!carrier) continue;
    const context = results.map((r) => r.text).join("\n\n");
    const analysis = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `You are an insurance underwriting expert. Analyze the client's information against the carrier's guidelines and provide a fit score (0-100), reasons for recommendation, concerns, and estimated underwriting class.

Client Information:
- Age: ${intakeData.age || "Not provided"}
- State: ${intakeData.state || "Not provided"}
- Height: ${intakeData.height || "Not provided"} inches
- Weight: ${intakeData.weight || "Not provided"} lbs
- Nicotine use: ${intakeData.nicotineUse || "Not provided"}
- Health conditions: ${intakeData.majorConditions || "None specified"}
- Coverage amount: $${intakeData.coverageAmount || "Not specified"}

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
        estimatedPremium: result.estimatedPremium || "Quote required",
        underwritingClass: result.estimatedClass || "Standard",
        citations: results.map((r) => ({
          documentTitle: `${carrier.display_name} Guidelines`,
          relevantText: r.text.substring(0, 200) + "...",
          confidence: r.confidence
        }))
      });
    } catch (error) {
      recommendations.push({
        carrierId,
        carrierName: carrier.display_name,
        fitScore: 75,
        reasons: [`Matches ${carrier.display_name} guidelines`],
        concerns: ["Detailed review required"],
        estimatedPremium: "Quote required",
        underwritingClass: "Standard",
        citations: results.map((r) => ({
          documentTitle: `${carrier.display_name} Guidelines`,
          relevantText: r.text.substring(0, 200) + "...",
          confidence: r.confidence
        }))
      });
    }
  }
  return recommendations.sort((a, b) => b.fitScore - a.fitScore);
}
__name(generateRecommendations, "generateRecommendations");
var production_index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    try {
      if (path === "/api/health" && request.method === "GET") {
        return new Response(JSON.stringify({
          status: "healthy",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          environment: {
            hasDB: !!env.DB,
            hasBucket: !!env.DOCS_BUCKET,
            hasVectorize: !!env.CARRIER_INDEX,
            hasAI: !!env.AI
          }
        }), { headers });
      }
      if (path === "/api/carriers/process-documents" && request.method === "POST") {
        try {
          const documents = await env.DB.prepare(
            "SELECT * FROM documents WHERE processed = FALSE OR processed IS NULL"
          ).all();
          let processedCount = 0;
          for (const doc of documents.results || []) {
            await processDocumentForRAG(doc.r2_key, doc.id, env);
            await env.DB.prepare(
              "UPDATE documents SET processed = TRUE WHERE id = ?"
            ).bind(doc.id).run();
            processedCount++;
          }
          return new Response(JSON.stringify({
            success: true,
            processed: processedCount,
            message: `Processed ${processedCount} documents for RAG`
          }), { headers });
        } catch (error) {
          console.error("Document processing error:", error);
          return new Response(JSON.stringify({
            error: "Failed to process documents",
            message: error instanceof Error ? error.message : "Unknown error"
          }), { status: 500, headers });
        }
      }
      if (path === "/api/carriers/sync-r2" && request.method === "POST") {
        try {
          const objects = await env.DOCS_BUCKET.list();
          let syncCount = 0;
          for (const obj of objects.objects) {
            const filename = obj.key.split("/").pop() || obj.key;
            const carrierInfo = extractCarrierInfo(filename);
            const existingDoc = await env.DB.prepare(
              "SELECT id FROM documents WHERE r2_key = ?"
            ).bind(obj.key).first();
            if (existingDoc) continue;
            const documentId = crypto.randomUUID();
            const createdAt = (/* @__PURE__ */ new Date()).toISOString();
            const existingCarrier = await env.DB.prepare(
              "SELECT id FROM carriers WHERE id = ?"
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
              (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              1,
              obj.key,
              "underwriting_guide",
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
          console.error("R2 sync error:", error);
          return new Response(JSON.stringify({
            error: "Failed to sync R2 documents",
            message: error instanceof Error ? error.message : "Unknown error"
          }), { status: 500, headers });
        }
      }
      if (path === "/api/intake/submit" && request.method === "POST") {
        const data = await request.json();
        const authHeader = request.headers.get("Authorization");
        const userId = authHeader?.replace("Bearer ", "") || "anonymous";
        const userProfile = await verifyUserAccess(userId, env);
        if (!userProfile || userProfile.subscriptionStatus !== "active") {
          return new Response(JSON.stringify({
            error: "Access denied",
            message: "Valid subscription required"
          }), { status: 403, headers });
        }
        if (!await checkUsageLimits(userProfile)) {
          return new Response(JSON.stringify({
            error: "Usage limit exceeded",
            message: "Monthly recommendation limit reached"
          }), { status: 429, headers });
        }
        const intakeId = crypto.randomUUID();
        const createdAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(
          `INSERT INTO intakes (id, user_id, form_data, status, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          intakeId,
          userId,
          JSON.stringify(data),
          "processing",
          createdAt
        ).run();
        const searchQuery = `
          Age ${data.age} in ${data.state},
          ${data.height} inches ${data.weight} lbs,
          nicotine use: ${data.nicotineUse || "never"},
          health conditions: ${data.majorConditions || "none"},
          coverage amount: $${data.coverageAmount || "500000"}
        `;
        const ragResults = await performRAGSearch(searchQuery, env, 15);
        const recommendations = await generateRecommendations(data, ragResults, env);
        const recommendationId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO recommendations (id, intake_id, user_id, recommendations_data, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          recommendationId,
          intakeId,
          userId,
          JSON.stringify(recommendations),
          "completed",
          createdAt
        ).run();
        await env.DB.prepare(
          "UPDATE user_profiles SET recommendations_used = recommendations_used + 1, last_active_at = ? WHERE user_id = ?"
        ).bind(createdAt, userId).run();
        await env.DB.prepare(
          "UPDATE intakes SET status = ?, completed_at = ? WHERE id = ?"
        ).bind("completed", createdAt, intakeId).run();
        return new Response(JSON.stringify({
          intakeId,
          recommendationId,
          recommendations,
          totalRecommendations: recommendations.length,
          processed: true
        }), { headers });
      }
      if (path.startsWith("/api/recommendations/") && request.method === "GET") {
        const recommendationId = path.split("/").pop();
        const recommendation = await env.DB.prepare(
          "SELECT * FROM recommendations WHERE id = ?"
        ).bind(recommendationId).first();
        if (!recommendation) {
          return new Response(JSON.stringify({
            error: "Not found"
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
      if (path === "/api/analytics/summary" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        const userId = authHeader?.replace("Bearer ", "") || "anonymous";
        const userProfile = await verifyUserAccess(userId, env);
        if (!userProfile) {
          return new Response(JSON.stringify({
            error: "Access denied"
          }), { status: 403, headers });
        }
        const recommendations = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM recommendations WHERE user_id = ?"
        ).bind(userId).first();
        const intakes = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM intakes WHERE user_id = ?"
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
      if (path === "/api/stripe/webhook" && request.method === "POST") {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400, headers });
        }
        try {
          const event = JSON.parse(body);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              const subscription = event.data.object;
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
                subscription.customer_email || "",
                subscription.status,
                "individual",
                // Map from Stripe price ID
                200,
                new Date(subscription.current_period_start * 1e3).toISOString(),
                new Date(subscription.current_period_end * 1e3).toISOString(),
                (/* @__PURE__ */ new Date()).toISOString()
              ).run();
              break;
          }
          return new Response(JSON.stringify({ received: true }), { headers });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response("Webhook error", { status: 400, headers });
        }
      }
      return new Response(JSON.stringify({
        error: "Not Found",
        path,
        method: request.method
      }), { status: 404, headers });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), { status: 500, headers });
    }
  }
};

// ../../../../Users/Administrator/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../Users/Administrator/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-PFJle9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = production_index_default;

// ../../../../Users/Administrator/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-PFJle9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=production-index.js.map
