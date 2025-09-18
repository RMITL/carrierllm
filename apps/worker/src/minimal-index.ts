import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
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
router.get('/api/health', async () => {
  return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Analytics endpoint with demo data for testing
router.get('/api/analytics/summary', async (request, env: Env) => {
  const userId = request.headers.get('X-User-Id');

  // Return demo data
  return Response.json({
    stats: {
      totalIntakes: 42,
      averageFitScore: 85,
      placementRate: 72,
      remainingRecommendations: 58
    },
    topCarriers: [
      { id: '1', name: 'Progressive', count: 15, successRate: 89 },
      { id: '2', name: 'State Farm', count: 12, successRate: 85 },
      { id: '3', name: 'Allstate', count: 10, successRate: 78 },
      { id: '4', name: 'Geico', count: 8, successRate: 92 },
      { id: '5', name: 'Liberty Mutual', count: 6, successRate: 75 }
    ],
    trends: [
      { month: '2025-01', intakes: 12, conversions: 9, conversionRate: 75 },
      { month: '2024-12', intakes: 18, conversions: 13, conversionRate: 72 },
      { month: '2024-11', intakes: 15, conversions: 10, conversionRate: 67 },
      { month: '2024-10', intakes: 20, conversions: 14, conversionRate: 70 },
      { month: '2024-09', intakes: 10, conversions: 8, conversionRate: 80 },
      { month: '2024-08', intakes: 14, conversions: 11, conversionRate: 79 }
    ],
    lastUpdated: new Date().toISOString()
  });
});

// Intake endpoint for submitting forms
router.post('/api/intake/submit', async (request, env: Env) => {
  const intake = await request.json();
  const intakeId = crypto.randomUUID();
  const recommendationId = crypto.randomUUID();

  // Return mock successful response
  return Response.json({
    intakeId,
    recommendationId,
    summary: {
      averageFit: 85,
      eligibleCarriers: 5,
      processingTime: 1250
    },
    recommendations: [
      {
        carrierId: 'progressive',
        carrierName: 'Progressive',
        fitScore: 92,
        highlights: ['Competitive rates', 'Strong financial stability', 'Good customer service'],
        concerns: [],
        premiumRange: { min: 1200, max: 1800 },
        citations: [
          {
            id: '1',
            source: 'Progressive Underwriting Guide',
            section: 'Risk Assessment',
            content: 'Coverage available for standard risk profiles',
            confidence: 0.92,
            metadata: { page: 42 }
          }
        ]
      },
      {
        carrierId: 'statefarm',
        carrierName: 'State Farm',
        fitScore: 88,
        highlights: ['Local agent support', 'Multi-policy discounts'],
        concerns: ['Premium may be higher'],
        premiumRange: { min: 1400, max: 2000 },
        citations: []
      },
      {
        carrierId: 'allstate',
        carrierName: 'Allstate',
        fitScore: 85,
        highlights: ['Accident forgiveness', 'Safe driving bonuses'],
        concerns: [],
        premiumRange: { min: 1300, max: 1900 },
        citations: []
      }
    ]
  });
});

// Get recommendation by ID
router.get('/api/recommendations/:id', async (request, env: Env) => {
  return Response.json({
    recommendationId: request.params.id,
    summary: {
      averageFit: 85,
      eligibleCarriers: 3
    },
    recommendations: [
      {
        carrierId: 'progressive',
        carrierName: 'Progressive',
        fitScore: 92,
        highlights: ['Best match for profile'],
        citations: []
      }
    ]
  });
});

// CORS preflight
router.options('*', () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Catch all
router.all('*', () => Response.json({ message: 'Not found' }, { status: 404 }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);

      // Add CORS headers to all responses
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    } catch (err) {
      console.error('Worker error:', err);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  }
};