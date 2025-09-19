var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/comprehensive-worker.ts
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-Organization-Id",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
async function populateCarriersFromDocuments(env) {
  try {
    const existingCarriers = await env.DB.prepare("SELECT COUNT(*) as count FROM carriers").first();
    if (existingCarriers && existingCarriers.count > 0) {
      return;
    }
    console.log("Populating carriers table from existing documents...");
    const list = await env.DOCS_BUCKET.list();
    const carriers = /* @__PURE__ */ new Map();
    for (const obj of list.objects) {
      const filename = obj.key;
      const carrierInfo = extractCarrierInfo(filename);
      if (carrierInfo && !carriers.has(carrierInfo.id)) {
        carriers.set(carrierInfo.id, carrierInfo);
      }
    }
    for (const carrier of carriers.values()) {
      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO carriers (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          carrier.id,
          carrier.name,
          carrier.amBest,
          carrier.portalUrl,
          carrier.agentPhone,
          carrier.preferredTierRank,
          JSON.stringify(carrier.availableStates)
        ).run();
      } catch (error) {
        console.error(`Error inserting carrier ${carrier.id}:`, error);
      }
    }
    console.log(`Populated ${carriers.size} carriers from documents`);
  } catch (error) {
    console.error("Error populating carriers from documents:", error);
  }
}
__name(populateCarriersFromDocuments, "populateCarriersFromDocuments");
function extractCarrierInfo(filename) {
  const nameWithoutExt = filename.replace(/\.(pdf|doc|docx|txt)$/i, "");
  const parts = nameWithoutExt.split(/[-_\s]+/).filter((part) => part.length > 0);
  if (parts.length === 0) return null;
  const carrierName = parts[0];
  const carrierId = carrierName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    id: carrierId,
    name: carrierName,
    amBest: "A+",
    // Default value
    portalUrl: `https://${carrierId}.com`,
    // Default URL
    agentPhone: "1-800-CARRIER",
    // Default phone
    preferredTierRank: 1,
    // Default rank
    availableStates: ["All States"]
    // Default states
  };
}
__name(extractCarrierInfo, "extractCarrierInfo");
var comprehensive_worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }
    try {
      if (path === "/api/health") {
        return new Response(JSON.stringify({
          status: "healthy",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          path
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/analytics/summary" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        const now = /* @__PURE__ */ new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let stats = {
          totalIntakes: 0,
          averageFitScore: 0,
          placementRate: 0,
          remainingRecommendations: 0
        };
        let topCarriers = [];
        let trends = [];
        try {
          const intakesResult = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM (
              SELECT id FROM intakes
              UNION ALL
              SELECT id FROM intake_submissions
            )
          `).first();
          stats.totalIntakes = intakesResult?.count || 0;
          if (userId) {
            try {
              const userUsage = await env.DB.prepare(`
                SELECT COUNT(*) as used
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= ?
              `).bind(userId, monthStart).first();
              const used = userUsage?.used || 0;
              const userProfile = await env.DB.prepare(
                "SELECT recommendations_limit FROM user_profiles WHERE user_id = ?"
              ).bind(userId).first();
              const limit = userProfile?.recommendations_limit || 0;
              stats.remainingRecommendations = Math.max(0, limit - used);
            } catch (e) {
              console.log("Could not get user usage:", e);
            }
            try {
              const avgScore = await env.DB.prepare(`
                SELECT AVG(fit_score) as avg
                FROM recommendations
                WHERE user_id = ?
              `).bind(userId).first();
              if (avgScore?.avg) {
                stats.averageFitScore = Math.round(avgScore.avg);
              } else {
                stats.averageFitScore = 0;
              }
            } catch (e) {
              console.log("Could not get average score:", e);
            }
            try {
              const topCarriersResult = await env.DB.prepare(`
                SELECT carrier_name, COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                GROUP BY carrier_name
                ORDER BY count DESC
                LIMIT 5
              `).bind(userId).all();
              topCarriers = topCarriersResult.results || [];
            } catch (e) {
              console.log("Could not get top carriers:", e);
            }
            try {
              const trendsResult = await env.DB.prepare(`
                SELECT 
                  strftime('%Y-%m', created_at) as month,
                  COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month
              `).bind(userId).all();
              trends = trendsResult.results || [];
            } catch (e) {
              console.log("Could not get trends:", e);
            }
          }
          try {
            const placements = await env.DB.prepare(`
              SELECT 
                COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                COUNT(*) as total
              FROM outcomes
            `).first();
            if (placements?.total > 0) {
              const placementData = placements;
              stats.placementRate = Math.round(placementData.placed / placementData.total * 100);
            } else {
              stats.placementRate = 0;
            }
          } catch (e) {
            console.log("Could not get placement rate:", e);
          }
        } catch (dbError) {
          console.error("Database error in analytics:", dbError);
        }
        return new Response(JSON.stringify({
          stats,
          topCarriers,
          trends
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/carriers/with-preferences" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        await populateCarriersFromDocuments(env);
        const carriers = await env.DB.prepare("SELECT * FROM carriers ORDER BY name").all();
        const userPreferences = await env.DB.prepare(
          "SELECT carrier_id, enabled FROM user_carrier_preferences WHERE user_id = ?"
        ).bind(userId).all();
        const organizationId = request.headers.get("X-Organization-Id");
        let orgSettings = { results: [] };
        if (organizationId) {
          orgSettings = await env.DB.prepare(
            "SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?"
          ).bind(organizationId).all();
        }
        const carriersWithPreferences = carriers.results.map((carrier) => {
          const userPref = userPreferences.results.find((pref) => pref.carrier_id === carrier.id);
          const orgSetting = orgSettings.results.find((setting) => setting.carrier_id === carrier.id);
          const userEnabled = userPref ? userPref.enabled : true;
          const organizationEnabled = orgSetting ? orgSetting.enabled : true;
          const isOrganizationControlled = organizationId && orgSetting && !orgSetting.enabled;
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
        return new Response(JSON.stringify(carriersWithPreferences), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/carriers/preferences" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const { carrierId, enabled } = await request.json();
        if (!carrierId || typeof enabled !== "boolean") {
          return new Response(JSON.stringify({ error: "carrierId and enabled are required" }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        await env.DB.prepare(`
          INSERT INTO user_carrier_preferences (user_id, carrier_id, enabled, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, carrier_id) DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = datetime('now')
        `).bind(userId, carrierId, enabled).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/documents/user" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const documents = await env.DB.prepare(`
          SELECT id, filename, carrier_id, carrier_name, effective_date, file_size, file_type, 
                 created_at, processed
          FROM user_documents 
          WHERE user_id = ? 
          ORDER BY created_at DESC
        `).bind(userId).all();
        return new Response(JSON.stringify(documents.results), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/documents/upload" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const formData = await request.formData();
        const file = formData.get("file");
        const carrierId = formData.get("carrierId");
        const carrierName = formData.get("carrierName");
        const effectiveDate = formData.get("effectiveDate");
        if (!file || !carrierId || !carrierName) {
          return new Response(JSON.stringify({ error: "file, carrierId, and carrierName are required" }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
        if (!allowedTypes.includes(file.type)) {
          return new Response(JSON.stringify({ error: "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed." }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "File size too large. Maximum size is 10MB." }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const fileExtension = file.name.split(".").pop();
        const filename = `${carrierId}_${timestamp}.${fileExtension}`;
        const r2Key = `user-documents/${userId}/${filename}`;
        const fileBuffer = await file.arrayBuffer();
        await env.DOCS_BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type
          }
        });
        const result = await env.DB.prepare(`
          INSERT INTO user_documents (user_id, filename, carrier_id, carrier_name, effective_date, 
                                    file_size, file_type, r2_key, created_at, processed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
        `).bind(
          userId,
          file.name,
          carrierId,
          carrierName,
          effectiveDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          file.size,
          file.type,
          r2Key
        ).run();
        return new Response(JSON.stringify({
          success: true,
          documentId: result.meta.last_row_id,
          message: `Successfully uploaded ${file.name} for ${carrierName}`
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/user/history" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          let history;
          try {
            history = await env.DB.prepare(`
              SELECT 
                r.id,
                r.submission_id,
                r.carrier_name,
                r.fit_score,
                r.created_at,
                i.data as intake_data
              FROM recommendations r
              LEFT JOIN intakes i ON r.submission_id = i.id
              WHERE r.user_id = ?
              ORDER BY r.created_at DESC
              LIMIT 50
            `).bind(userId).all();
          } catch (tableError) {
            console.log("Recommendations table not found, trying intakes table:", tableError);
            history = await env.DB.prepare(`
              SELECT 
                id,
                id as submission_id,
                'Unknown Carrier' as carrier_name,
                0 as fit_score,
                created_at,
                data as intake_data
              FROM intakes
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT 50
            `).bind(userId).all();
          }
          const formattedHistory = history.results.map((item) => ({
            id: item.id,
            submissionId: item.submission_id,
            carrierName: item.carrier_name,
            fitScore: item.fit_score,
            createdAt: item.created_at,
            intakeData: item.intake_data ? JSON.parse(item.intake_data) : null
          }));
          return new Response(JSON.stringify(formattedHistory), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error fetching user history:", error);
          return new Response(JSON.stringify([]), {
            headers: corsHeaders()
          });
        }
      }
      if (path === "/api/intake/submit" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const intakeData = await request.json();
          const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(`
            INSERT INTO intakes (id, user_id, data, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(submissionId, userId, JSON.stringify(intakeData)).run();
          const recommendations = [];
          for (const rec of recommendations) {
            try {
              await env.DB.prepare(`
                INSERT INTO recommendations (user_id, submission_id, carrier_name, fit_score, 
                                          reasons, advisories, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                userId,
                submissionId,
                rec.carrierName,
                rec.fitScore,
                JSON.stringify(rec.reasons),
                JSON.stringify(rec.advisories)
              ).run();
            } catch (e) {
              console.log("Could not store recommendation:", e);
            }
          }
          return new Response(JSON.stringify({
            submissionId,
            recommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error processing intake:", error);
          return new Response(JSON.stringify({ error: "Failed to process intake" }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path.startsWith("/api/recommendations/") && method === "GET") {
        const submissionId = path.split("/")[3];
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const recommendations = await env.DB.prepare(`
            SELECT carrier_name, fit_score, reasons, advisories, created_at
            FROM recommendations
            WHERE submission_id = ? AND user_id = ?
            ORDER BY fit_score DESC
          `).bind(submissionId, userId).all();
          const formattedRecommendations = recommendations.results.map((rec) => ({
            carrierName: rec.carrier_name,
            fitScore: rec.fit_score,
            reasons: rec.reasons ? JSON.parse(rec.reasons) : [],
            advisories: rec.advisories ? JSON.parse(rec.advisories) : [],
            createdAt: rec.created_at
          }));
          return new Response(JSON.stringify({
            submissionId,
            recommendations: formattedRecommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error fetching recommendations:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch recommendations" }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path === "/api/outcomes" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const { submissionId, carrierName, status, notes } = await request.json();
          await env.DB.prepare(`
            INSERT INTO outcomes (user_id, submission_id, carrier_name, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(userId, submissionId, carrierName, status, notes || "").run();
          return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error logging outcome:", error);
          return new Response(JSON.stringify({ error: "Failed to log outcome" }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      return new Response(JSON.stringify({
        message: "Not found",
        path
      }), {
        status: 404,
        headers: corsHeaders()
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-EbSQiy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = comprehensive_worker_default;

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-EbSQiy/middleware-loader.entry.ts
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
//# sourceMappingURL=comprehensive-worker.js.map
