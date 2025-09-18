import { Router } from 'itty-router';
import { z } from 'zod';

type VectorizeIndex = unknown;

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  AI: any;
  STRIPE_WEBHOOK_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  CLERK_SECRET_KEY: string;
  APP_URL: string;
  WWW_URL: string;
}

const router = Router();

// Health check endpoint
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Intake endpoint
router.post('/api/intake/submit', async (request, env: Env) => {
  try {
    const json = await request.json();

    // Store in database
    const submissionId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO intake_submissions (id, type, data, created_at) VALUES (?, ?, ?, ?)'
    ).bind(submissionId, 'intake', JSON.stringify(json), new Date().toISOString()).run();

    return new Response(JSON.stringify({
      submissionId,
      status: 'success'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process intake' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Recommendations endpoint
router.get('/api/recommendations/:id', async (request, env: Env) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM intake_submissions WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return mock recommendations
    return new Response(JSON.stringify({
      submissionId: id,
      recommendations: [
        {
          carrier: 'Carrier A',
          score: 0.95,
          reasons: ['Good coverage', 'Competitive rates']
        },
        {
          carrier: 'Carrier B',
          score: 0.88,
          reasons: ['Strong network', 'Fast approval']
        }
      ]
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get recommendations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Analytics endpoint
router.get('/api/analytics/summary', async (request, env: Env) => {
  try {
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM intake_submissions'
    ).first();

    return new Response(JSON.stringify({
      totalSubmissions: result?.total || 0,
      avgRecommendationScore: 0.91
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 404 handler
router.all('*', () => {
  return new Response('Not Found', { status: 404 });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  }
};