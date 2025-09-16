import { Router } from 'itty-router';
import { z } from 'zod';

type VectorizeIndex = unknown;

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  STRIPE_WEBHOOK_SECRET: string;
}

const intakeSchema = z.object({
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

const router = Router({ base: '/api' });

router.post('/intake/submit', async (request, env: Env) => {
  const json = await request.json().catch(() => undefined);
  const parsed = intakeSchema.safeParse(json);

  if (!parsed.success) {
    return new Response(JSON.stringify({ message: 'Invalid payload', issues: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const submissionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO submissions (id, created_at, payload)
     VALUES (?, ?, ?)`
  )
    .bind(submissionId, createdAt, JSON.stringify(parsed.data.answers))
    .run();

  const recommendationResponse = await buildRecommendationResponse(submissionId, parsed.data.answers, env);

  await env.DB.prepare(
    `INSERT INTO recommendations (submission_id, payload)
     VALUES (?, ?)`
  )
    .bind(submissionId, JSON.stringify(recommendationResponse))
    .run();

  return Response.json(recommendationResponse, { status: 201 });
});

router.get('/recommendations/:id', async ({ params }, env: Env) => {
  const result = await env.DB.prepare(
    'SELECT payload FROM recommendations WHERE submission_id = ?'
  )
    .bind(params?.id)
    .first<{ payload: string }>();

  if (!result) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  return new Response(result.payload, {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/outcomes', async (request, env: Env) => {
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

router.post('/carriers/upload', async (request, env: Env) => {
  const json = await request.json().catch(() => undefined);
  const parsed = uploadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const key = `carriers/${parsed.data.carrierId}/${parsed.data.filename}`;
  await env.DOCS_BUCKET.put(key, JSON.stringify(parsed.data), {
    httpMetadata: { contentType: 'application/json' }
  });

  return Response.json({ key }, { status: 201 });
});

router.get('/analytics/summary', async (_request, env: Env) => {
  const aggregates = await env.DB.prepare(
    `SELECT
      COUNT(*) as totalSubmissions,
      AVG(json_extract(recommendations.payload, '$.summary.averageFit')) as averageFit
     FROM submissions
     LEFT JOIN recommendations ON submissions.id = recommendations.submission_id`
  ).first<{ totalSubmissions: number; averageFit: number }>();

  const placement = await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvals,
      COUNT(*) as total
     FROM outcomes`
  ).first<{ approvals: number; total: number }>();

  const placementRate = placement?.total ? Math.round((placement.approvals / placement.total) * 100) : 0;

  return Response.json({
    totalSubmissions: aggregates?.totalSubmissions ?? 0,
    averageFit: Math.round(aggregates?.averageFit ?? 0),
    placementRate,
    lastUpdated: new Date().toISOString()
  });
});

router.all('*', () => Response.json({ message: 'Not found' }, { status: 404 }));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx)
};

async function buildRecommendationResponse(
  submissionId: string,
  answers: z.infer<typeof intakeSchema>['answers'],
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

function getMockCarriers(answers: z.infer<typeof intakeSchema>['answers']) {
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
