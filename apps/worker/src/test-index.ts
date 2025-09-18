// Simple test worker with all required endpoints
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
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
    
    if (path === '/api/health') {
      return Response.json({ status: 'healthy', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // Analytics endpoint
    if (path === '/api/analytics/summary') {
      try {
        const userId = request.headers.get('X-User-Id');
        
        // Return demo analytics data
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 75,
            placementRate: 65,
            remainingRecommendations: 100
          },
          topCarriers: [
            { id: '1', name: 'Progressive', count: 15, successRate: 89 },
            { id: '2', name: 'State Farm', count: 12, successRate: 85 },
            { id: '3', name: 'Allstate', count: 10, successRate: 78 }
          ],
          trends: [
            { month: '2025-01', intakes: 12, conversions: 9, conversionRate: 75 },
            { month: '2024-12', intakes: 18, conversions: 13, conversionRate: 72 },
            { month: '2024-11', intakes: 15, conversions: 10, conversionRate: 67 }
          ],
          lastUpdated: new Date().toISOString()
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('Analytics endpoint error:', error);
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 75,
            placementRate: 65,
            remainingRecommendations: 100
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
        // Return empty subscription data (user doesn't have a subscription yet)
        return Response.json({
          userId,
          subscription: null,
          usage: {
            current: 0,
            limit: 100,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          },
          plan: null
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('Subscription endpoint error:', error);
        return Response.json({
          userId,
          subscription: null,
          usage: { current: 0, limit: 100, resetDate: new Date().toISOString() },
          plan: null,
          error: 'Subscription data temporarily unavailable'
        }, { status: 200, headers: corsHeaders });
      }
    }

    // User history endpoint
    if (path.startsWith('/api/user/') && path.endsWith('/history') && request.method === 'GET') {
      const userId = path.split('/')[3];
      try {
        // Return empty history for new users
        return Response.json([], { headers: corsHeaders });
      } catch (error) {
        console.error('History endpoint error:', error);
        return Response.json([], { headers: corsHeaders });
      }
    }
    
    if (path === '/api/intake/submit' && request.method === 'POST') {
      const intake = await request.json();
      return Response.json({
        recommendationId: 'test-' + Date.now(),
        status: 'completed',
        intake: intake,
        recommendations: [
          {
            carrierId: 'progressive',
            carrierName: 'Progressive',
            fitScore: 92,
            tier: 'preferred',
            reasoning: {
              pros: ['Competitive rates', 'Strong financial stability'],
              cons: [],
              summary: 'Strong fit with Progressive based on your profile.'
            },
            estimatedPremium: {
              monthly: 1200,
              annual: 14400,
              confidence: 'high'
            },
            underwritingPath: 'simplified',
            requiresExam: false,
            processingTime: '2-3 weeks',
            citations: []
          }
        ],
        top: [
          {
            carrierId: 'progressive',
            carrierName: 'Progressive',
            fitScore: 92,
            tier: 'preferred',
            reasoning: {
              pros: ['Competitive rates', 'Strong financial stability'],
              cons: [],
              summary: 'Strong fit with Progressive based on your profile.'
            },
            estimatedPremium: {
              monthly: 1200,
              annual: 14400,
              confidence: 'high'
            },
            underwritingPath: 'simplified',
            requiresExam: false,
            processingTime: '2-3 weeks',
            citations: []
          }
        ],
        premiumSuggestion: 'Based on your profile, we recommend starting with a monthly premium of $1,200 for optimal coverage.',
        summary: {
          averageFit: 88,
          totalCarriersEvaluated: 3,
          tier2Recommended: false,
          topCarrierId: 'progressive',
          notes: 'Strong match with multiple competitive options available.'
        },
        metadata: {
          processingTime: 1250,
          ragQueriesCount: 5,
          citationsFound: 12,
          modelUsed: 'gpt-4'
        },
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }
    
    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  }
};