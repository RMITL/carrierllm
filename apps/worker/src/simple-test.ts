import { Router } from 'itty-router';

const router = Router();

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Organization-Id',
    'Content-Type': 'application/json'
  };
}

// CORS preflight
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
});

// Health check
router.get('/api/health', () => {
  return Response.json(
    { status: 'healthy', timestamp: new Date().toISOString() },
    { headers: corsHeaders() }
  );
});

// Test carriers endpoint
router.get('/api/carriers/test', () => {
  return Response.json(
    { message: 'Carriers test endpoint working', carriers: [] },
    { headers: corsHeaders() }
  );
});

// Default 404 handler
router.all('*', () => {
  return Response.json(
    { message: 'Not found' },
    { status: 404, headers: corsHeaders() }
  );
});

// Export worker
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};
