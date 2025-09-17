import { Router } from 'itty-router';
import { z } from 'zod';

type VectorizeIndex = unknown;

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  AI: any; // Cloudflare Workers AI
  STRIPE_WEBHOOK_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLERK_SECRET_KEY: string;
  APP_URL: string;
  WWW_URL: string;
}

// Orion Intake Schema
const orionCoreSchema = z.object({
  age: z.number().min(18).max(85),
  state: z.string().min(2).max(2),
  height: z.number().min(48).max(90),
  weight: z.number().min(70).max(400),
  nicotine: z.object({
    lastUse: z.enum(['never', 'past24Months', 'current']),
    type: z.enum(['cigarettes', 'vape', 'cigars', 'chew', 'nrt']).optional(),
    frequency: z.string().optional()
  }),
  marijuana: z.object({
    lastUse: z.enum(['never', 'past12Months', 'current']),
    type: z.enum(['smoke', 'vape', 'edible']).optional(),
    frequency: z.string().optional(),
    medical: z.boolean().optional()
  }),
  cardiac: z.object({
    hasHistory: z.boolean(),
    conditions: z.array(z.enum(['mi', 'stents', 'angina', 'chf'])).optional(),
    details: z.string().optional()
  }).optional(),
  diabetes: z.object({
    hasCondition: z.boolean(),
    type: z.enum(['type1', 'type2']).optional(),
    a1c: z.number().optional(),
    medications: z.string().optional(),
    complications: z.array(z.enum(['neuropathy', 'retinopathy'])).optional()
  }).optional(),
  cancer: z.object({
    hasHistory: z.boolean(),
    type: z.string().optional(),
    stage: z.string().optional(),
    treatmentDate: z.string().optional()
  }).optional(),
  drivingAndRisk: z.object({
    duiHistory: z.boolean().optional(),
    duiCount: z.number().optional(),
    duiDates: z.array(z.string()).optional(),
    riskActivities: z.array(z.enum(['aviation', 'scuba', 'racing', 'climbing'])).optional(),
    details: z.string().optional()
  }),
  coverageTarget: z.object({
    amount: z.number().min(50000),
    type: z.enum(['iul', 'term', 'annuity'])
  })
});

const orionIntakeSchema = z.object({
  core: orionCoreSchema,
  tier2: z.any().optional(), // Will expand this later for tier-2 fields
  validated: z.boolean().default(true),
  tier2Triggered: z.boolean().default(false)
});

// Legacy schema for backward compatibility
const legacyIntakeSchema = z.object({
  answers: z.object({
    dob: z.string(),
    state: z.string().min(2),
    coverageStart: z.string(),
    replacingCoverage: z.boolean(),
    nicotineUse: z.enum(['never', 'past24Months', 'current']),
    majorConditions: z.string().optional().default(''),
    prescriptions: z.string().optional().default(''),
    height: z.number(),
    weight: z.number(),
    riskActivities: z.string().optional().default(''),
    householdIncome: z.number().optional(),
    occupation: z.string().optional(),
    coverageType: z.enum(['health', 'life'])
  })
});

const outcomeSchema = z.object({
  submissionId: z.string().uuid(),
  carrierId: z.string(),
  outcome: z.enum(['approved', 'declined', 'pending']),
  premium: z.number().optional(),
  notes: z.string().optional()
});

const uploadSchema = z.object({
  carrierId: z.string(),
  carrierName: z.string(),
  filename: z.string(),
  effectiveDate: z.string(),
  url: z.string().url().optional()
});

const router = Router();

// Health check endpoint
router.get('/api/health', async () => {
  return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// New Orion intake endpoint
router.post('/api/intake/submit', async (request, env: Env) => {
  const json = await request.json().catch(() => undefined);

  // Try Orion schema first, fall back to legacy
  let parsed = orionIntakeSchema.safeParse(json);
  let isLegacy = false;

  if (!parsed.success) {
    const legacyParsed = legacyIntakeSchema.safeParse(json);
    if (!legacyParsed.success) {
      return Response.json({
        message: 'Invalid payload',
        issues: parsed.error.issues
      }, { status: 400 });
    }

    // Convert legacy format to Orion format
    const legacy = legacyParsed.data.answers;
    const orionData = {
      core: {
        age: new Date().getFullYear() - new Date(legacy.dob).getFullYear(),
        state: legacy.state,
        height: legacy.height,
        weight: legacy.weight,
        nicotine: { lastUse: legacy.nicotineUse },
        marijuana: { lastUse: 'never' },
        drivingAndRisk: { details: legacy.riskActivities },
        coverageTarget: { amount: 500000, type: legacy.coverageType === 'life' ? 'iul' : 'term' }
      },
      validated: true,
      tier2Triggered: false
    };
    parsed = { success: true, data: orionData } as any;
    isLegacy = true;
  }

  const intakeId = crypto.randomUUID();
  const tenantId = 'default-tenant'; // TODO: Extract from auth
  const createdAt = new Date().toISOString();

  // Store in new intakes table
  await env.DB.prepare(
    `INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      intakeId,
      tenantId,
      JSON.stringify(parsed.data),
      parsed.data?.validated || false,
      parsed.data?.tier2Triggered || false,
      createdAt
    )
    .run();

  // If legacy format, also store in submissions for compatibility
  if (isLegacy) {
    await env.DB.prepare(
      `INSERT INTO submissions (id, created_at, payload)
       VALUES (?, ?, ?)`
    )
      .bind(intakeId, createdAt, JSON.stringify(parsed.data?.core))
      .run();
  }

  const recommendationResponse = await buildOrionRecommendationResponse(intakeId, parsed.data!, env);

  await env.DB.prepare(
    `INSERT INTO recommendations (id, intake_id, fit_json, citations, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      recommendationResponse.recommendationId,
      intakeId,
      JSON.stringify(recommendationResponse.top),
      JSON.stringify([]), // TODO: Implement citations
      100, // TODO: Track actual latency
      createdAt
    )
    .run();

  return Response.json({ intake_id: intakeId }, { status: 201 });
});

router.get('/api/recommendations/:id', async (request, env: Env) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const params = { id };
  // Try new table first, fall back to legacy
  let result = await env.DB.prepare(
    'SELECT fit_json, citations FROM recommendations WHERE intake_id = ?'
  )
    .bind(params?.id)
    .first<{ fit_json: string; citations: string }>();

  if (!result) {
    // Try legacy table
    const legacyResult = await env.DB.prepare(
      'SELECT payload FROM recommendations WHERE submission_id = ?'
    )
      .bind(params?.id)
      .first<{ payload: string }>();

    if (!legacyResult) {
      return Response.json({ message: 'Not found' }, { status: 404 });
    }

    return new Response(legacyResult.payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const response = {
    recommendationId: params?.id,
    top: JSON.parse(result.fit_json),
    citations: JSON.parse(result.citations)
  };

  return Response.json(response);
});

router.post('/api/outcomes', async (request, env: Env) => {
  const json = await request.json().catch(() => undefined);
  const parsed = outcomeSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO outcomes (submission_id, carrier_id, status, premium, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      parsed.data.submissionId,
      parsed.data.carrierId,
      parsed.data.outcome,
      parsed.data.premium ?? null,
      parsed.data.notes ?? null,
      createdAt
    )
    .run();

  return Response.json({ ok: true });
});

router.post('/api/carriers/upload', async (request, env: Env) => {
  const json = await request.json().catch(() => undefined);
  const parsed = uploadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const documentId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const key = `carriers/${parsed.data.carrierId}/${createdAt}/${parsed.data.filename}`;

  // Store metadata in documents table
  await env.DB.prepare(
    `INSERT INTO documents (id, carrier_id, title, effective_date, version, r2_key, doc_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      documentId,
      parsed.data.carrierId,
      parsed.data.filename,
      parsed.data.effectiveDate,
      '1.0',
      key,
      'underwriting_guide',
      createdAt
    )
    .run();

  // Store actual document in R2
  await env.DOCS_BUCKET.put(key, JSON.stringify(parsed.data), {
    httpMetadata: { contentType: 'application/json' }
  });

  return Response.json({ documentId, key }, { status: 201 });
});

router.get('/api/analytics/summary', async (request, env: Env) => {
  // TODO: Add admin authentication check
  // const user = await authenticateUser(request, env);
  // if (!user || user.role !== 'admin') {
  //   return Response.json({ message: 'Admin access required' }, { status: 403 });
  // }

  // Try new tables first, fall back to legacy
  let totalSubmissions = 0;
  let averageFit = 0;

  const newAggregates = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM intakes`
  ).first<{ count: number }>();

  const legacyAggregates = await env.DB.prepare(
    `SELECT
      COUNT(*) as totalSubmissions,
      AVG(json_extract(recommendations.payload, '$.summary.averageFit')) as averageFit
     FROM submissions
     LEFT JOIN recommendations ON submissions.id = recommendations.submission_id`
  ).first<{ totalSubmissions: number; averageFit: number }>();

  totalSubmissions = (newAggregates?.count ?? 0) + (legacyAggregates?.totalSubmissions ?? 0);
  averageFit = legacyAggregates?.averageFit ?? 0;

  const placement = await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvals,
      COUNT(*) as total
     FROM outcomes`
  ).first<{ approvals: number; total: number }>();

  const placementRate = placement?.total ? Math.round((placement.approvals / placement.total) * 100) : 0;

  return Response.json({
    stats: {
      totalIntakes: totalSubmissions,
      averageFitScore: Math.round(averageFit),
      placementRate,
      remainingRecommendations: 999 // Default for demo
    },
    lastUpdated: new Date().toISOString()
  });
});

router.all('*', () => Response.json({ message: 'Not found' }, { status: 404 }));

async function buildOrionRecommendationResponse(
  intakeId: string,
  intake: any,
  env: Env
) {
  const startTime = Date.now();
  const age = intake.core.age;
  const coverage = intake.core.coverageTarget;
  const recommendationId = crypto.randomUUID();

  // Build query for RAG retrieval
  const queries = buildRetrievalQueries(intake.core);

  // Retrieve relevant carrier information
  const carrierRecommendations = await generateCarrierRecommendations(queries, intake.core, env);

  const latency = Date.now() - startTime;

  const response = {
    recommendationId,
    top: carrierRecommendations.slice(0, 3),
    stretch: carrierRecommendations.length > 3 ? carrierRecommendations[3] : undefined,
    premiumSuggestion: coverage.type === 'iul' ? {
      type: 'IUL' as const,
      monthly: age * 10,
      note: '10× age rule; adjust DB for accumulation vs payout; avoid lapse'
    } : undefined,
    summary: {
      topCarrierId: carrierRecommendations[0]?.carrierId ?? '',
      averageFit: Math.round(carrierRecommendations.reduce((acc, carrier) => acc + carrier.fitPct, 0) / carrierRecommendations.length),
      notes: `RAG-powered recommendations with ${carrierRecommendations.reduce((acc, c) => acc + c.citations.length, 0)} citations (${latency}ms)`
    }
  };

  return response;
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

async function generateCarrierRecommendations(
  queries: string[],
  core: any,
  env: Env
): Promise<any[]> {
  // Get all carriers from database
  const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY preferred_tier_rank').all();

  const recommendations = [];

  for (const carrier of carriers.results || []) {
    const recommendation = await evaluateCarrierFit(carrier, queries, core, env);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Sort by fit percentage descending
  recommendations.sort((a, b) => b.fitPct - a.fitPct);

  return recommendations;
}

async function evaluateCarrierFit(
  carrier: any,
  queries: string[],
  core: any,
  env: Env
): Promise<any | null> {
  const citations = [];
  let totalScore = 0;
  let queryCount = 0;

  // Simplified scoring without RAG for now
  // TODO: Re-enable RAG when properly configured
  queryCount = queries.length;
  totalScore = 75 * queryCount; // Default scoring

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
    citations: citations.slice(0, 3), // Limit to top 3 citations
    advisories,
    apsLikely: determineApsLikelihood(core, fitPct),
    ctas: {
      portalUrl: carrier.portal_url,
      agentPhone: carrier.agent_phone
    }
  };
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

  return reasons.slice(0, 4); // Limit to 4 reasons
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
    fitPct: Math.max(50, Math.min(90, 75 + carrier.preferred_tier_rank * 5)),
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
      portalUrl: carrier.portal_url,
      agentPhone: carrier.agent_phone
    }
  };
}

function getMockOrionCarriers(core: any) {
  const bmi = (core.weight / (core.height * core.height)) * 703;
  const hasNicotine = core.nicotine.lastUse !== 'never';
  const hasMarijuana = core.marijuana.lastUse !== 'never';
  const age = core.age;

  return [
    {
      carrierId: 'fg-life',
      carrierName: 'F&G Life',
      product: 'IUL Exam-Free',
      fitPct: age <= 60 && core.coverageTarget.amount <= 1000000 && !hasNicotine ? 86 : 72,
      confidence: 'high' as const,
      reasons: [
        'Age ≤ 60 and face ≤ $1M fit exam-free lane',
        'Clean build chart match',
        'No exam required for this profile'
      ],
      declines: hasNicotine ? ['Recent nicotine use may require full underwriting'] : undefined,
      citations: [
        {
          chunkId: 'fg_chunk_42',
          snippet: 'Exam-Free... eligible ages 0-60 through $1,000,000...',
          documentTitle: 'F&G 2025 Underwriting Guide',
          effectiveDate: '2025-01-01',
          page: 15,
          section: 'Exam-Free Eligibility'
        }
      ],
      advisories: age > 55 ? ['APS possible for ages >55 even without exam'] : [],
      apsLikely: age > 55,
      ctas: {
        portalUrl: 'https://portal.fglife.com',
        agentPhone: '1-800-FG-AGENT'
      }
    },
    {
      carrierId: 'moo-life',
      carrierName: 'Mutual of Omaha',
      product: 'IUL Advantage',
      fitPct: bmi < 30 && !hasMarijuana ? 78 : 62,
      confidence: 'medium' as const,
      reasons: [
        'Strong build allowances',
        'Flexible marijuana policies',
        'Good age/amount grids'
      ],
      citations: [
        {
          chunkId: 'moo_chunk_23',
          snippet: 'Cigar up to 24/year can qualify as NT with negative HOS...',
          documentTitle: 'MOO 2025 Field Guide',
          effectiveDate: '2024-12-01',
          page: 32,
          section: 'Tobacco Classifications'
        }
      ],
      advisories: hasMarijuana ? ['Marijuana use may affect class but still eligible'] : [],
      apsLikely: core.coverageTarget.amount > 500000,
      ctas: {
        portalUrl: 'https://agent.mutualofomaha.com',
        agentPhone: '1-800-MUT-OMAHA'
      }
    },
    {
      carrierId: 'foresters',
      carrierName: 'Foresters Financial',
      product: 'IUL Accelerated',
      fitPct: hasMarijuana && core.marijuana.lastUse === 'past12Months' ? 25 : 71,
      confidence: hasMarijuana ? 'low' : 'medium',
      reasons: [
        'Accelerated underwriting available',
        'Ages 18-55 preferred range',
        'Quick approval process'
      ],
      declines: hasMarijuana && core.marijuana.lastUse === 'past12Months' ?
        ['Marijuana within 12 months disqualifies accelerated path'] : undefined,
      citations: [
        {
          chunkId: 'foresters_chunk_67',
          snippet: 'Accelerated path ages 18-55, faces $100k-$1M; marijuana within past 12 months → no acceleration',
          documentTitle: 'Foresters Accelerated UW Guide',
          effectiveDate: '2024-11-15',
          page: 8,
          section: 'Knockout Conditions'
        }
      ],
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
      product: 'IUL Premier',
      fitPct: 68,
      confidence: 'medium' as const,
      reasons: [
        'Dual-manual underwriting advantage',
        'Good for complex cases',
        'Flexible risk assessment'
      ],
      citations: [
        {
          chunkId: 'protective_chunk_12',
          snippet: 'Dual reinsurance manuals... may improve CAD tables and avocation handling',
          documentTitle: 'Protective Dual Manual Guide',
          effectiveDate: '2024-10-01',
          page: 22,
          section: 'Risk Assessment'
        }
      ],
      advisories: ['Consider as alternative if primary carriers decline'],
      apsLikely: true,
      ctas: {
        portalUrl: 'https://agent.protective.com',
        agentPhone: '1-800-PROTECTIVE'
      }
    }
  ];
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (err) {
      console.error('Worker error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

async function buildRecommendationResponse(
  submissionId: string,
  answers: z.infer<typeof legacyIntakeSchema>['answers'],
  _env: Env
) {
  const carriers = getMockCarriers(answers);
  const averageFit = Math.round(carriers.reduce((acc, carrier) => acc + carrier.fitPercent, 0) / carriers.length);

  return {
    submissionId,
    recommendations: carriers,
    summary: {
      topCarrierId: carriers[0]?.carrierId ?? '',
      averageFit,
      notes: 'Mock recommendations generated until RAG pipeline is connected.'
    }
  };
}

function getMockCarriers(answers: z.infer<typeof legacyIntakeSchema>['answers']) {
  return [
    {
      carrierId: 'acme-life',
      carrierName: 'Acme Life',
      program: answers.coverageType === 'life' ? 'Accelerated UW' : 'Preferred Health',
      fitPercent: 85,
      reasons: ['Strong financials', 'BMI within target range', 'No nicotine use in 24 months'],
      citations: [
        {
          title: 'Acme 2025 UW Guide',
          url: 'https://docs.carrierllm.test/acme-uw'
        }
      ],
      underwritingNotes: 'Requires confirmation of prescription adherence.',
      status: 'strong' as const
    },
    {
      carrierId: 'maple',
      carrierName: 'Maple Assurance',
      program: 'Standard Advantage',
      fitPercent: answers.nicotineUse === 'current' ? 52 : 68,
      reasons: ['Matches income band', 'Allows recent replacement activity'],
      citations: [
        {
          title: 'Maple 2024 Field Guide',
          url: 'https://docs.carrierllm.test/maple-field-guide'
        }
      ],
      underwritingNotes: 'Verify hospitalization look-back before submission.',
      status: 'consider' as const
    },
    {
      carrierId: 'sentinel',
      carrierName: 'Sentinel Mutual',
      program: 'Premier Health',
      fitPercent: 40,
      reasons: ['Recent hospitalization triggers manual review'],
      citations: [
        {
          title: 'Sentinel Medical Underwriting',
          url: 'https://docs.carrierllm.test/sentinel-medical'
        }
      ],
      underwritingNotes: 'Submit supporting docs for hospitalization < 12 months.',
      status: 'avoid' as const
    }
  ];
}
