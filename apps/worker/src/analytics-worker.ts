interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      // Health check
      if (path === '/api/health') {
        return new Response(
          JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
          { status: 200, headers }
        );
      }

      // Analytics endpoint
      if (path === '/api/analytics/summary') {
        const userId = request.headers.get('X-User-Id');

        const analyticsData = {
          stats: {
            totalIntakes: userId ? 42 : 0,
            averageFitScore: userId ? 85 : 0,
            placementRate: userId ? 72 : 0,
            remainingRecommendations: userId ? 58 : 5
          },
          topCarriers: userId ? [
            { id: '1', name: 'Progressive', count: 15, successRate: 89 },
            { id: '2', name: 'State Farm', count: 12, successRate: 85 },
            { id: '3', name: 'Allstate', count: 10, successRate: 78 },
            { id: '4', name: 'Geico', count: 8, successRate: 92 },
            { id: '5', name: 'Liberty Mutual', count: 6, successRate: 75 }
          ] : [],
          trends: userId ? [
            { month: '2025-01', intakes: 12, conversions: 9, conversionRate: 75 },
            { month: '2024-12', intakes: 18, conversions: 13, conversionRate: 72 },
            { month: '2024-11', intakes: 15, conversions: 10, conversionRate: 67 },
            { month: '2024-10', intakes: 20, conversions: 14, conversionRate: 70 },
            { month: '2024-09', intakes: 10, conversions: 8, conversionRate: 80 },
            { month: '2024-08', intakes: 14, conversions: 11, conversionRate: 79 }
          ] : [],
          lastUpdated: new Date().toISOString()
        };

        return new Response(JSON.stringify(analyticsData), { status: 200, headers });
      }

      // Intake submit endpoint
      if (path === '/api/intake/submit' && request.method === 'POST') {
        const intake = await request.json();
        const intakeId = crypto.randomUUID();
        const recommendationId = crypto.randomUUID();

        const response = {
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
        };

        return new Response(JSON.stringify(response), { status: 200, headers });
      }

      // Get recommendation endpoint
      if (path.startsWith('/api/recommendations/') && request.method === 'GET') {
        const id = path.split('/').pop();

        const response = {
          recommendationId: id,
          summary: {
            averageFit: 85,
            eligibleCarriers: 3,
            processingTime: 1250
          },
          recommendations: [
            {
              carrierId: 'progressive',
              carrierName: 'Progressive',
              fitScore: 92,
              highlights: ['Best match for profile', 'Excellent coverage options'],
              concerns: [],
              premiumRange: { min: 1200, max: 1800 },
              citations: [
                {
                  id: '1',
                  source: 'Progressive Underwriting Guide',
                  section: 'Coverage Guidelines',
                  content: 'Standard coverage available for qualified applicants',
                  confidence: 0.95
                }
              ]
            },
            {
              carrierId: 'statefarm',
              carrierName: 'State Farm',
              fitScore: 88,
              highlights: ['Strong local presence', 'Bundle discounts available'],
              concerns: [],
              premiumRange: { min: 1400, max: 2000 },
              citations: []
            }
          ]
        };

        return new Response(JSON.stringify(response), { status: 200, headers });
      }

      // Default 404
      return new Response(
        JSON.stringify({ message: 'Not found' }),
        { status: 404, headers }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers }
      );
    }
  }
};