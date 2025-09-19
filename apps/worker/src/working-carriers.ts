// Working carriers worker without external dependencies
interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
}

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Organization-Id',
    'Content-Type': 'application/json'
  };
}

// Function to populate carriers table from existing documents
async function populateCarriersFromDocuments(env: Env) {
  try {
    // Check if carriers table is empty
    const existingCarriers = await env.DB.prepare('SELECT COUNT(*) as count FROM carriers').first() as { count: number } | null;
    if (existingCarriers && existingCarriers.count > 0) {
      return; // Carriers already populated
    }

    console.log('Populating carriers table from existing documents...');

    // List all documents in R2
    const list = await env.DOCS_BUCKET.list();

    // Extract unique carriers from document names
    const carriers = new Map<string, any>();
    
    for (const obj of list.objects) {
      const filename = obj.key;
      const carrierInfo = extractCarrierInfo(filename);
      
      if (carrierInfo && !carriers.has(carrierInfo.id)) {
        carriers.set(carrierInfo.id, carrierInfo);
      }
    }

    // Insert carriers into database
    for (const carrier of carriers.values()) {
      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO carriers (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          carrier.id,
          carrier.name,
          carrier.amBest,
          carrier.portalUrl,
          carrier.agentPhone,
          carrier.preferredTierRank,
          JSON.stringify(carrier.availableStates)
        ).run();
      } catch (error) {
        console.error(`Error inserting carrier ${carrier.id}:`, error);
      }
    }

    console.log(`Populated ${carriers.size} carriers from documents`);
  } catch (error) {
    console.error('Error populating carriers from documents:', error);
  }
}

// Function to extract carrier information from filename
function extractCarrierInfo(filename: string) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(pdf|doc|docx|txt)$/i, '');
  
  // Split by common separators and clean up
  const parts = nameWithoutExt.split(/[-_\s]+/).filter(part => part.length > 0);
  
  if (parts.length === 0) return null;
  
  // Use the first part as carrier name, create ID from it
  const carrierName = parts[0];
  const carrierId = carrierName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return {
    id: carrierId,
    name: carrierName,
    amBest: 'A+', // Default value
    portalUrl: `https://${carrierId}.com`, // Default URL
    agentPhone: '1-800-CARRIER', // Default phone
    preferredTierRank: 1, // Default rank
    availableStates: ['All States'] // Default states
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    try {
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          path: path 
        }), {
          headers: corsHeaders()
        });
      }

      // Test carriers endpoint
      if (path === '/api/carriers/test') {
        return new Response(JSON.stringify({ 
          message: 'Carriers test endpoint working',
          carriers: []
        }), {
          headers: corsHeaders()
        });
      }

      // Get carriers with user preferences
      if (path === '/api/carriers/with-preferences' && method === 'GET') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        // First, ensure carriers are populated from existing documents
        await populateCarriersFromDocuments(env);

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

        return new Response(JSON.stringify(carriersWithPreferences), { 
          headers: corsHeaders() 
        });
      }

      // Update user carrier preference
      if (path === '/api/carriers/preferences' && method === 'POST') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        const { carrierId, enabled } = await request.json() as { carrierId: string; enabled: boolean };
        if (!carrierId || typeof enabled !== 'boolean') {
          return new Response(JSON.stringify({ error: 'carrierId and enabled are required' }), { 
            status: 400, 
            headers: corsHeaders() 
          });
        }

        // Upsert user preference
        await env.DB.prepare(`
          INSERT INTO user_carrier_preferences (user_id, carrier_id, enabled, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, carrier_id) DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = datetime('now')
        `).bind(userId, carrierId, enabled).run();

        return new Response(JSON.stringify({ success: true }), { 
          headers: corsHeaders() 
        });
      }

      // Get user documents
      if (path === '/api/documents/user' && method === 'GET') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        const documents = await env.DB.prepare(`
          SELECT id, filename, carrier_id, carrier_name, effective_date, file_size, file_type, 
                 created_at, processed
          FROM user_documents 
          WHERE user_id = ? 
          ORDER BY created_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify(documents.results), { 
          headers: corsHeaders() 
        });
      }

      // Upload document
      if (path === '/api/documents/upload' && method === 'POST') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const carrierId = formData.get('carrierId') as string;
        const carrierName = formData.get('carrierName') as string;
        const effectiveDate = formData.get('effectiveDate') as string;

        if (!file || !carrierId || !carrierName) {
          return new Response(JSON.stringify({ error: 'file, carrierId, and carrierName are required' }), { 
            status: 400, 
            headers: corsHeaders() 
          });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          return new Response(JSON.stringify({ error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' }), { 
            status: 400, 
            headers: corsHeaders() 
          });
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'File size too large. Maximum size is 10MB.' }), { 
            status: 400, 
            headers: corsHeaders() 
          });
        }

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExtension = file.name.split('.').pop();
        const filename = `${carrierId}_${timestamp}.${fileExtension}`;
        const r2Key = `user-documents/${userId}/${filename}`;

        // Upload to R2
        const fileBuffer = await file.arrayBuffer();
        await env.DOCS_BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // Store metadata in database
        const result = await env.DB.prepare(`
          INSERT INTO user_documents (user_id, filename, carrier_id, carrier_name, effective_date, 
                                    file_size, file_type, r2_key, created_at, processed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
        `).bind(
          userId,
          file.name,
          carrierId,
          carrierName,
          effectiveDate || new Date().toISOString().split('T')[0],
          file.size,
          file.type,
          r2Key
        ).run();

        return new Response(JSON.stringify({ 
          success: true, 
          documentId: result.meta.last_row_id,
          message: `Successfully uploaded ${file.name} for ${carrierName}` 
        }), { 
          headers: corsHeaders() 
        });
      }

      // Default 404 handler
      return new Response(JSON.stringify({ 
        message: 'Not found',
        path: path 
      }), {
        status: 404,
        headers: corsHeaders()
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};
