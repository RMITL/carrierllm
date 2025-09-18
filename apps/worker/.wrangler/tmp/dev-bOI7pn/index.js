var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-xfJbYy/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../../node_modules/.pnpm/itty-router@5.0.22/node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: (r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams)
    n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e:
    try {
      for (let t3 of r2.before || [])
        if (null != (a = await t3(e2.proxy ?? e2, ...o2)))
          break e;
      t:
        for (let [r3, n2, l, i] of t2)
          if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
            e2.params = s.groups || {}, e2.route = i;
            for (let t3 of l)
              if (null != (a = await t3(e2.proxy ?? e2, ...o2)))
                break t;
          }
    } catch (t3) {
      if (!r2.catch)
        throw t3;
      a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
    }
  try {
    for (let t3 of r2.finally || [])
      a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch)
      throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response)
    return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");

// src/index.ts
var router = t();
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
router.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
});
router.get("/api/health", () => {
  return Response.json(
    { status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() },
    { headers: corsHeaders() }
  );
});
router.get("/api/analytics/summary", async (request, env) => {
  try {
    const userId = request.headers.get("X-User-Id");
    const now = /* @__PURE__ */ new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let stats = {
      totalIntakes: 0,
      averageFitScore: 75,
      placementRate: 65,
      remainingRecommendations: 100
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
          stats.remainingRecommendations = Math.max(0, 100 - used);
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
              successRate: Math.round(c.avg_score || 75)
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
              conversions: Math.round((m.count || 0) * 0.72),
              // Estimated conversion
              conversionRate: 72
            }));
          }
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
          stats.placementRate = Math.round(placements.placed / placements.total * 100);
        }
      } catch (e) {
        console.log("Could not get placement rate:", e);
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
    }
    if (topCarriers.length === 0) {
      topCarriers = [
        { id: "1", name: "Progressive", count: 15, successRate: 89 },
        { id: "2", name: "State Farm", count: 12, successRate: 85 },
        { id: "3", name: "Allstate", count: 10, successRate: 78 }
      ];
    }
    if (trends.length === 0) {
      trends = [
        { month: "2025-01", intakes: 12, conversions: 9, conversionRate: 75 },
        { month: "2024-12", intakes: 18, conversions: 13, conversionRate: 72 },
        { month: "2024-11", intakes: 15, conversions: 10, conversionRate: 67 }
      ];
    }
    return Response.json({
      stats,
      topCarriers,
      trends,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }, {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error("Analytics endpoint error:", error);
    return Response.json({
      stats: {
        totalIntakes: 0,
        averageFitScore: 75,
        placementRate: 65,
        remainingRecommendations: 100
      },
      topCarriers: [],
      trends: [],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Analytics data temporarily unavailable"
    }, {
      status: 200,
      // Return 200 to prevent app crashes
      headers: corsHeaders()
    });
  }
});
router.post("/api/intake/submit", async (request, env) => {
  try {
    const intake = await request.json();
    const intakeId = crypto.randomUUID();
    const recommendationId = crypto.randomUUID();
    const userId = request.headers.get("X-User-Id") || "anonymous";
    try {
      await env.DB.prepare(`
        INSERT INTO intakes (id, data, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(intakeId, JSON.stringify(intake), userId, (/* @__PURE__ */ new Date()).toISOString()).run();
    } catch (e) {
      console.log("Could not log intake:", e);
    }
    const recommendations = [
      {
        carrierId: "progressive",
        carrierName: "Progressive",
        fitScore: 92,
        highlights: ["Competitive rates", "Strong financial stability", "Good customer service"],
        concerns: [],
        premiumRange: { min: 1200, max: 1800 },
        citations: []
      },
      {
        carrierId: "statefarm",
        carrierName: "State Farm",
        fitScore: 88,
        highlights: ["Local agent support", "Multi-policy discounts"],
        concerns: ["Premium may be higher"],
        premiumRange: { min: 1400, max: 2e3 },
        citations: []
      },
      {
        carrierId: "allstate",
        carrierName: "Allstate",
        fitScore: 85,
        highlights: ["Accident forgiveness", "Safe driving bonuses"],
        concerns: [],
        premiumRange: { min: 1300, max: 1900 },
        citations: []
      }
    ];
    for (const rec of recommendations) {
      try {
        await env.DB.prepare(`
          INSERT INTO recommendations (
            id, recommendation_id, user_id, carrier_id, carrier_name,
            fit_score, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          recommendationId,
          userId,
          rec.carrierId,
          rec.carrierName,
          rec.fitScore,
          (/* @__PURE__ */ new Date()).toISOString()
        ).run();
      } catch (e) {
        console.log("Could not store recommendation:", e);
      }
    }
    return Response.json({
      intakeId,
      recommendationId,
      summary: {
        averageFit: 88,
        eligibleCarriers: recommendations.length,
        processingTime: 1250
      },
      recommendations
    }, {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error("Intake submission error:", error);
    return Response.json(
      { error: "Failed to process intake" },
      { status: 500, headers: corsHeaders() }
    );
  }
});
router.get("/api/user/:userId/history", async (request, env) => {
  const { userId } = request.params;
  try {
    const history = [];
    try {
      const intakes = await env.DB.prepare(`
        SELECT id, data, created_at
        FROM intakes
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userId).all();
      if (intakes?.results) {
        for (const intake of intakes.results) {
          history.push({
            id: intake.id,
            type: "intake",
            data: JSON.parse(intake.data || "{}"),
            createdAt: intake.created_at,
            status: "completed"
          });
        }
      }
    } catch (e) {
      console.log("Could not get intakes:", e);
    }
    try {
      const recommendations = await env.DB.prepare(`
        SELECT
          recommendation_id,
          user_id,
          carrier_id,
          carrier_name,
          fit_score,
          created_at,
          COUNT(*) as carrier_count,
          AVG(fit_score) as avg_fit
        FROM recommendations
        WHERE user_id = ? AND recommendation_id IS NOT NULL
        GROUP BY recommendation_id
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userId).all();
      if (recommendations?.results) {
        for (const rec of recommendations.results) {
          history.push({
            id: rec.recommendation_id,
            recommendationId: rec.recommendation_id,
            type: "recommendation",
            data: {},
            createdAt: rec.created_at,
            status: "completed",
            summary: {
              averageFit: Math.round(rec.avg_fit || 0),
              eligibleCarriers: rec.carrier_count || 0,
              topCarrierId: rec.carrier_id
            }
          });
        }
      }
    } catch (e) {
      console.log("Could not get recommendations:", e);
    }
    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Response.json(history, {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error("History endpoint error:", error);
    return Response.json(
      { error: "Failed to fetch history" },
      { status: 500, headers: corsHeaders() }
    );
  }
});
router.get("/api/recommendations/:id", async (request, env) => {
  const { id } = request.params;
  try {
    const recs = await env.DB.prepare(`
      SELECT * FROM recommendations
      WHERE recommendation_id = ?
    `).bind(id).all();
    if (recs?.results && recs.results.length > 0) {
      const recommendations = recs.results.map((r2) => ({
        carrierId: r2.carrier_id,
        carrierName: r2.carrier_name,
        fitScore: r2.fit_score,
        highlights: ["Based on your profile"],
        concerns: [],
        premiumRange: { min: 1200, max: 1800 },
        citations: []
      }));
      return Response.json({
        recommendationId: id,
        summary: {
          averageFit: 85,
          eligibleCarriers: recommendations.length,
          processingTime: 1250
        },
        recommendations
      }, {
        headers: corsHeaders()
      });
    }
  } catch (e) {
    console.log("Could not get recommendations:", e);
  }
  return Response.json({
    recommendationId: id,
    summary: {
      averageFit: 85,
      eligibleCarriers: 2,
      processingTime: 1250
    },
    recommendations: [
      {
        carrierId: "progressive",
        carrierName: "Progressive",
        fitScore: 92,
        highlights: ["Best match for profile"],
        concerns: [],
        premiumRange: { min: 1200, max: 1800 },
        citations: []
      }
    ]
  }, {
    headers: corsHeaders()
  });
});
router.post("/webhook", async (request, env) => {
  return Response.json(
    { received: true },
    { status: 200, headers: corsHeaders() }
  );
});
router.all("*", () => {
  return Response.json(
    { message: "Not found" },
    { status: 404, headers: corsHeaders() }
  );
});
var src_default = {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error("Worker error:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};

// ../../node_modules/.pnpm/wrangler@3.114.14_@cloudflare+workers-types@4.20250913.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../node_modules/.pnpm/wrangler@3.114.14_@cloudflare+workers-types@4.20250913.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-xfJbYy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/.pnpm/wrangler@3.114.14_@cloudflare+workers-types@4.20250913.0/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-xfJbYy/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
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
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
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
//# sourceMappingURL=index.js.map
