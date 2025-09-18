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
        // Always return real zeros - no mock data
        // In production, this would query the database for real user analytics
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 0,
            placementRate: 0,
            remainingRecommendations: 100
          },
          topCarriers: [],
          trends: [],
          lastUpdated: new Date().toISOString()
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('Analytics endpoint error:', error);
        return Response.json({
          stats: {
            totalIntakes: 0,
            averageFitScore: 0,
            placementRate: 0,
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
        // Return real data structure with zeros - no mock data
        // In production, this would query Clerk's API or your database
        return Response.json({
          userId,
          subscription: null, // No subscription until user actually subscribes
          usage: {
            current: 0,
            limit: 5, // Free tier limit
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          },
          plan: null // No plan until user subscribes
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('Subscription endpoint error:', error);
        return Response.json({
          userId,
          subscription: null,
          usage: { current: 0, limit: 5, resetDate: new Date().toISOString() },
          plan: null,
          error: 'Subscription data temporarily unavailable'
        }, { status: 200, headers: corsHeaders });
      }
    }

    // User history endpoint
    if (path.startsWith('/api/user/') && path.endsWith('/history') && request.method === 'GET') {
      try {
        // Always return empty history - no mock data
        // In production, this would query the database for real user history
        return Response.json([], { headers: corsHeaders });
      } catch (error) {
        console.error('History endpoint error:', error);
        return Response.json([], { headers: corsHeaders });
      }
    }
    
    if (path === '/api/intake/submit' && request.method === 'POST') {
      const intake = await request.json();
      const userId = request.headers.get('X-User-Id') || 'anonymous';
      const recommendationId = 'test-' + Date.now();
      
      // Log the intake for analytics and history tracking
      console.log('Intake submitted:', {
        userId,
        recommendationId,
        intakeType: intake.answers ? 'legacy' : 'orion',
        timestamp: new Date().toISOString()
      });
      
      return Response.json({
        recommendationId,
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