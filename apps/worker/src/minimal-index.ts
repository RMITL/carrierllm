import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
}

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
    { message: 'Carriers test endpoint working' },
    { headers: corsHeaders() }
  );
});

// Get carriers with user preferences
router.get('/api/carriers/with-preferences', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get all carriers
    const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY name').all();
    
    // Get user preferences
    const userPreferences = await env.DB.prepare(
      'SELECT carrier_id, enabled FROM user_carrier_preferences WHERE user_id = ?'
    ).bind(userId).all();

    // Get organization settings (if user is in an organization)
    const organizationId = request.headers.get('X-Organization-Id');
    let orgSettings = { results: [] as Array<{ carrier_id: string; enabled: boolean }> };
    if (organizationId) {
      orgSettings = await env.DB.prepare(
        'SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?'
      ).bind(organizationId).all() as { results: Array<{ carrier_id: string; enabled: boolean }> };
    }

    const carriersWithPreferences = carriers.results.map((carrier: any) => {
      const userPref = userPreferences.results.find((pref: any) => pref.carrier_id === carrier.id);
      const orgSetting = orgSettings.results.find((setting: any) => setting.carrier_id === carrier.id);
      
      const userEnabled = userPref ? userPref.enabled : true; // Default to enabled
      const organizationEnabled = orgSetting ? orgSetting.enabled : true; // Default to enabled
      const isOrganizationControlled = organizationId && orgSetting && !orgSetting.enabled; // Controlled if org disabled it

      return {
        id: carrier.id,
        name: carrier.name,
        amBest: carrier.am_best,
        portalUrl: carrier.portal_url,
        agentPhone: carrier.agent_phone,
        preferredTierRank: carrier.preferred_tier_rank,
        availableStates: carrier.available_states ? JSON.parse(carrier.available_states) : [],
        userEnabled,
        organizationEnabled,
        isOrganizationControlled
      };
    });

    return Response.json(carriersWithPreferences, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching carriers with preferences:', error);
    return Response.json({ error: 'Failed to fetch carriers' }, { status: 500, headers: corsHeaders() });
  }
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};