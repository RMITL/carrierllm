// Simple test worker
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
    }
    
    if (url.pathname === '/api/intake/submit' && request.method === 'POST') {
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
      });
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};