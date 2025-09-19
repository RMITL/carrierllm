import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: any;
  AI: any;
  RESEND_API_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;
  CRON_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
}

const router = Router();

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
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

// Analytics endpoint with live data
router.get('/api/analytics/summary', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');

    // Get current month for date filtering
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Initialize response data with real zeros
    let stats = {
      totalIntakes: 0,
      averageFitScore: 0,
      placementRate: 0,
      remainingRecommendations: 0
    };

    let topCarriers = [];
    let trends = [];

    try {
      // Get total intakes - check multiple tables for compatibility
      const intakesResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM intakes
          UNION ALL
          SELECT id FROM intake_submissions
        )
      `).first();

      stats.totalIntakes = intakesResult?.count || 0;

      // If we have a user ID, get user-specific data
      if (userId) {
        // Get user's monthly usage
        try {
          const userUsage = await env.DB.prepare(`
            SELECT COUNT(*) as used
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
          `).bind(userId, monthStart).first();

          const used = userUsage?.used || 0;
          // Get user's actual limit from their profile
          const userProfile = await env.DB.prepare(
            'SELECT recommendations_limit FROM user_profiles WHERE user_id = ?'
          ).bind(userId).first();
          
          const limit = userProfile?.recommendations_limit || 0;
          stats.remainingRecommendations = Math.max(0, limit - used);
        } catch (e) {
          console.log('Could not get user usage:', e);
        }

        // Get user's average fit score
        try {
          const avgScore = await env.DB.prepare(`
            SELECT AVG(fit_score) as avg
            FROM recommendations
            WHERE user_id = ?
          `).bind(userId).first();

          if (avgScore?.avg) {
            stats.averageFitScore = Math.round(avgScore.avg);
          } else {
            stats.averageFitScore = 0;
          }
        } catch (e) {
          console.log('Could not get average score:', e);
        }

        // Get top carriers
        try {
          const carriers = await env.DB.prepare(`
            SELECT
              carrier_id,
              carrier_name,
              COUNT(*) as count,
              AVG(fit_score) as avg_score
            FROM recommendations
            WHERE user_id = ?
            GROUP BY carrier_id, carrier_name
            ORDER BY count DESC
            LIMIT 5
          `).bind(userId).all();

          if (carriers?.results) {
            topCarriers = carriers.results.map((c: any, idx: number) => ({
              id: c.carrier_id || String(idx + 1),
              name: c.carrier_name || `Carrier ${idx + 1}`,
              count: c.count || 0,
              successRate: Math.round(c.avg_score || 0)
            }));
          }
        } catch (e) {
          console.log('Could not get top carriers:', e);
        }

        // Get monthly trends (last 6 months)
        try {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const monthlyData = await env.DB.prepare(`
            SELECT
              strftime('%Y-%m', created_at) as month,
              COUNT(*) as count
            FROM recommendations
            WHERE user_id = ?
              AND created_at >= ?
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 6
          `).bind(userId, sixMonthsAgo.toISOString()).all();

          if (monthlyData?.results) {
            trends = monthlyData.results.map((m: any) => ({
              month: m.month,
              intakes: m.count || 0,
              conversions: 0, // No real conversion data available
              conversionRate: 0
            }));
          }
        } catch (e) {
          console.log('Could not get trends:', e);
        }
      }

      // Calculate placement rate
      try {
        const placements = await env.DB.prepare(`
          SELECT
            COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
            COUNT(*) as total
          FROM outcomes
        `).first();

        if (placements?.total > 0) {
          stats.placementRate = Math.round((placements.placed / placements.total) * 100);
        } else {
          stats.placementRate = 0;
        }
      } catch (e) {
        console.log('Could not get placement rate:', e);
      }

    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue with default values if DB queries fail
    }

    // Return real data only - no mock data

    return Response.json({
      stats,
      topCarriers,
      trends,
      lastUpdated: new Date().toISOString()
    }, {
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Analytics endpoint error:', error);

    // Return real zeros on error - no mock data
    return Response.json({
      stats: {
        totalIntakes: 0,
        averageFitScore: 0,
        placementRate: 0,
        remainingRecommendations: 0
      },
      topCarriers: [],
      trends: [],
      lastUpdated: new Date().toISOString(),
      error: 'Analytics data temporarily unavailable'
    }, {
      status: 200, // Return 200 to prevent app crashes
      headers: corsHeaders()
    });
  }
});

// Intake submission endpoint
router.post('/api/intake/submit', async (request, env: Env) => {
  try {
    const intake = await request.json();
    const intakeId = crypto.randomUUID();
    const recommendationId = crypto.randomUUID();

    // Log intake to database
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
      await env.DB.prepare(`
        INSERT INTO intakes (id, data, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(intakeId, JSON.stringify(intake), userId, new Date().toISOString()).run();
    } catch (e) {
      console.log('Could not log intake:', e);
    }

    // TODO: Implement real recommendation generation using RAG system
    // For now, return empty recommendations until real data is available
    const recommendations = [];

    // Store recommendations
    for (const rec of recommendations) {
      try {
        await env.DB.prepare(`
          INSERT INTO recommendations (
            id, recommendation_id, user_id, carrier_id, carrier_name,
            fit_score, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          recommendationId,
          userId,
          rec.carrierId,
          rec.carrierName,
          rec.fitScore,
          new Date().toISOString()
        ).run();
      } catch (e) {
        console.log('Could not store recommendation:', e);
      }
    }

    // Return real response with empty recommendations until RAG system is implemented
    const response = {
      recommendationId,
      status: 'completed',
      intake: intake,
      recommendations: [],
      top: [],
      premiumSuggestion: 'No recommendations available. Please ensure carrier documents are uploaded and processed.',
      summary: {
        averageFit: 0,
        totalCarriersEvaluated: 0,
        tier2Recommended: false,
        topCarrierId: null,
        notes: 'No carriers available for recommendations. Please upload carrier documents and ensure they are processed.'
      },
      metadata: {
        processingTime: 0,
        ragQueriesCount: 0,
        citationsFound: 0,
        modelUsed: 'none'
      },
      timestamp: new Date().toISOString()
    };

    return Response.json(response, {
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Intake submission error:', error);
    return Response.json(
      { error: 'Failed to process intake' },
      { status: 500, headers: corsHeaders() }
    );
  }
});

// Get user history
router.get('/api/user/:userId/history', async (request, env: Env) => {
  const { userId } = request.params;

  try {
    const history = [];

    // Get user's intakes
    try {
      const intakes = await env.DB.prepare(`
        SELECT id, data, created_at
        FROM intakes
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userId).all();

      if (intakes?.results) {
        for (const intake of intakes.results) {
          history.push({
            id: intake.id,
            type: 'intake',
            data: JSON.parse(intake.data || '{}'),
            createdAt: intake.created_at,
            status: 'completed'
          });
        }
      }
    } catch (e) {
      console.log('Could not get intakes:', e);
    }

    // Get user's recommendations (group by recommendation_id to avoid duplicates)
    try {
      const recommendations = await env.DB.prepare(`
        SELECT
          recommendation_id,
          user_id,
          carrier_id,
          carrier_name,
          fit_score,
          created_at,
          COUNT(*) as carrier_count,
          AVG(fit_score) as avg_fit
        FROM recommendations
        WHERE user_id = ? AND recommendation_id IS NOT NULL
        GROUP BY recommendation_id
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userId).all();

      if (recommendations?.results) {
        for (const rec of recommendations.results) {
          history.push({
            id: rec.recommendation_id,
            recommendationId: rec.recommendation_id,
            type: 'recommendation',
            data: {},
            createdAt: rec.created_at,
            status: 'completed',
            summary: {
              averageFit: Math.round(rec.avg_fit || 0),
              eligibleCarriers: rec.carrier_count || 0,
              topCarrierId: rec.carrier_id
            }
          });
        }
      }
    } catch (e) {
      console.log('Could not get recommendations:', e);
    }

    // Sort by creation date
    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Response.json(history, {
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('History endpoint error:', error);
    return Response.json(
      { error: 'Failed to fetch history' },
      { status: 500, headers: corsHeaders() }
    );
  }
});

// Clear user history endpoint
router.delete('/api/user/:userId/history', async (request, env: Env) => {
  const { userId } = request.params;

  try {
    console.log('Clearing history for user:', userId);
    
    // Delete from all relevant tables
    await env.DB.prepare(`
      DELETE FROM recommendations WHERE user_id = ?
    `).bind(userId).run();
    
    await env.DB.prepare(`
      DELETE FROM intakes WHERE user_id = ?
    `).bind(userId).run();
    
    await env.DB.prepare(`
      DELETE FROM intake_submissions WHERE user_id = ?
    `).bind(userId).run();
    
    console.log('History cleared successfully for user:', userId);
    return Response.json({ success: true, message: 'History cleared successfully' }, { 
      headers: corsHeaders() 
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    return Response.json({ error: 'Failed to clear history' }, { 
      status: 500, 
      headers: corsHeaders() 
    });
  }
});

// Get recommendation by ID
router.get('/api/recommendations/:id', async (request, env: Env) => {
  const { id } = request.params;

  try {
    // Try to get real recommendations from DB
    const recs = await env.DB.prepare(`
      SELECT * FROM recommendations
      WHERE recommendation_id = ?
    `).bind(id).all();

    if (recs?.results && recs.results.length > 0) {
      const recommendations = recs.results.map((r: any) => ({
        carrierId: r.carrier_id,
        carrierName: r.carrier_name,
        fitScore: r.fit_score,
        highlights: ['Based on your profile'],
        concerns: [],
        premiumRange: { min: 1200, max: 1800 },
        citations: []
      }));

      return Response.json({
        recommendationId: id,
        summary: {
          averageFit: 85,
          eligibleCarriers: recommendations.length,
          processingTime: 1250
        },
        recommendations
      }, {
        headers: corsHeaders()
      });
    }
  } catch (e) {
    console.log('Could not get recommendations:', e);
  }

  // Return empty result if no real data found
  return Response.json({
    recommendationId: id,
    summary: {
      averageFit: 0,
      eligibleCarriers: 0,
      processingTime: 0
    },
    recommendations: []
  }, {
    headers: corsHeaders()
  });
});

// NOTE: All billing is handled by Clerk Billing
// Clerk automatically handles:
// - Stripe integration and webhook processing
// - Subscription status syncing to user/org metadata
// - Payment processing and invoicing
//
// To configure billing:
// 1. Go to Clerk Dashboard > Billing Settings
// 2. Create subscription plans
// 3. Use <PricingTable /> component in your React app
// 4. Check access with has({ plan: 'plan_name' }) or <Protect> component

// Utility function to extract carrier info from filename
function extractCarrierInfo(filename: string) {
  const name = filename.replace('.pdf', '').toLowerCase();
  const carrierMappings: Record<string, string> = {
    'agl': 'american-general-life',
    'allianz': 'allianz',
    'americo': 'americo',
    'columbus': 'columbus-life',
    'corbridge': 'corbridge',
    'ethos': 'ethos',
    'f&g': 'fidelity-guarantee',
    'foresters': 'foresters',
    'moo': 'mutual-of-omaha',
    'plag': 'pacific-life',
    'plc': 'pacific-life',
    'prudential': 'prudential',
    'securian': 'securian',
    'symetra': 'symetra',
    'transamerica': 'transamerica'
  };

  for (const [key, carrierId] of Object.entries(carrierMappings)) {
    if (name.includes(key)) {
      return {
        carrierId,
        carrierName: carrierId.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      };
    }
  }

  const firstWord = name.split(/[\s_-]/)[0];
  return {
    carrierId: firstWord.toLowerCase(),
    carrierName: firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  };
}

// Function to populate carriers table from existing documents
async function populateCarriersFromDocuments(env: Env) {
  try {
    // Check if carriers table is empty
    const existingCarriers = await env.DB.prepare('SELECT COUNT(*) as count FROM carriers').first();
    if (existingCarriers && existingCarriers.count > 0) {
      return; // Carriers already populated
    }

    console.log('Populating carriers table from existing documents...');

    // List all documents in R2
    const list = await env.DOCS_BUCKET.list();
    const pdfFiles = list.objects.filter(obj => obj.key.toLowerCase().endsWith('.pdf'));

    const carriersMap = new Map<string, any>();

    // Extract carrier info from each document
    for (const pdfFile of pdfFiles) {
      const carrierInfo = extractCarrierInfo(pdfFile.key);
      
      if (!carriersMap.has(carrierInfo.carrierId)) {
        carriersMap.set(carrierInfo.carrierId, {
          id: carrierInfo.carrierId,
          name: carrierInfo.carrierName,
          am_best: null, // Will be populated later if available
          portal_url: null,
          agent_phone: null,
          preferred_tier_rank: null,
          available_states: JSON.stringify([]),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Insert carriers into database
    for (const carrier of carriersMap.values()) {
      try {
        await env.DB.prepare(`
          INSERT INTO carriers (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          carrier.id,
          carrier.name,
          carrier.am_best,
          carrier.portal_url,
          carrier.agent_phone,
          carrier.preferred_tier_rank,
          carrier.available_states,
          carrier.created_at,
          carrier.updated_at
        ).run();
      } catch (error) {
        console.log(`Carrier ${carrier.id} might already exist, skipping...`);
      }
    }

    console.log(`Populated ${carriersMap.size} carriers from existing documents`);
  } catch (error) {
    console.error('Error populating carriers from documents:', error);
  }
}

// Get carriers with user preferences
router.get('/api/carriers/with-preferences', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
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
    // We'll get the organization ID from the request headers
    const organizationId = request.headers.get('X-Organization-Id');
    
    // Get organization settings if user is in an organization
    let orgSettings = { results: [] };
    if (organizationId) {
      orgSettings = await env.DB.prepare(
        'SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?'
      ).bind(organizationId).all();
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

// Update user carrier preference
router.post('/api/carriers/preferences', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const { carrierId, enabled } = await request.json();
    if (!carrierId || typeof enabled !== 'boolean') {
      return Response.json({ error: 'carrierId and enabled are required' }, { status: 400, headers: corsHeaders() });
    }

    // Upsert user preference
    await env.DB.prepare(`
      INSERT INTO user_carrier_preferences (id, user_id, carrier_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, carrier_id) DO UPDATE SET
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      userId,
      carrierId,
      enabled,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating carrier preference:', error);
    return Response.json({ error: 'Failed to update preference' }, { status: 500, headers: corsHeaders() });
  }
});

// Get user documents
router.get('/api/documents/user', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const documents = await env.DB.prepare(`
      SELECT * FROM user_documents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    return Response.json(documents.results, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return Response.json({ error: 'Failed to fetch documents' }, { status: 500, headers: corsHeaders() });
  }
});

// Upload document
router.post('/api/documents/upload', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    const formData = await request.formData();
    const carrierId = formData.get('carrierId') as string;
    const carrierName = formData.get('carrierName') as string;
    const title = formData.get('title') as string;
    const file = formData.get('file') as File;
    const docType = formData.get('docType') as string || 'underwriting_guide';
    const effectiveDate = formData.get('effectiveDate') as string;

    if (!carrierId || !carrierName || !title || !file) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['carrierId', 'carrierName', 'title', 'file']
      }, { status: 400, headers: corsHeaders() });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' }, { status: 400, headers: corsHeaders() });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400, headers: corsHeaders() });
    }

    const documentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const r2Key = `user-documents/${userId}/${carrierId}/${createdAt}/${file.name}`;

    // Store file in R2
    const fileBuffer = await file.arrayBuffer();
    await env.DOCS_BUCKET.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Store metadata in database
    await env.DB.prepare(`
      INSERT INTO user_documents (
        id, user_id, carrier_id, title, filename, r2_key, file_size, 
        content_type, doc_type, effective_date, version, processed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      documentId,
      userId,
      carrierId,
      title,
      file.name,
      r2Key,
      file.size,
      file.type,
      docType,
      effectiveDate || new Date().toISOString().split('T')[0],
      '1.0',
      false, // Will be processed later
      createdAt
    ).run();

    return Response.json({
      success: true,
      documentId,
      message: 'Document uploaded successfully'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('Error uploading document:', error);
    return Response.json({ error: 'Failed to upload document' }, { status: 500, headers: corsHeaders() });
  }
});

// Get organization carrier settings (admin only)
router.get('/api/carriers/organization-settings', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get organization ID from headers
    const organizationId = request.headers.get('X-Organization-Id');
    if (!organizationId) {
      return Response.json({ error: 'Organization ID required' }, { status: 400, headers: corsHeaders() });
    }

    // TODO: Verify user is admin in this organization using Clerk
    // For now, we'll allow all authenticated users to access this endpoint
    // In production, you'd verify the user's role in their organization

    // First, ensure carriers are populated from existing documents
    await populateCarriersFromDocuments(env);

    // Get all carriers
    const carriers = await env.DB.prepare('SELECT * FROM carriers ORDER BY name').all();
    
    const orgSettings = await env.DB.prepare(
      'SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?'
    ).bind(organizationId).all();
    
    const carriersWithSettings = carriers.results.map((carrier: any) => {
      const orgSetting = orgSettings.results.find((setting: any) => setting.carrier_id === carrier.id);
      const organizationEnabled = orgSetting ? orgSetting.enabled : true; // Default to enabled

      return {
        id: carrier.id,
        name: carrier.name,
        amBest: carrier.am_best,
        portalUrl: carrier.portal_url,
        agentPhone: carrier.agent_phone,
        preferredTierRank: carrier.preferred_tier_rank,
        availableStates: carrier.available_states ? JSON.parse(carrier.available_states) : [],
        userEnabled: true, // Not relevant for org admin view
        organizationEnabled,
        isOrganizationControlled: true // All carriers in org admin view are org-controlled
      };
    });

    return Response.json(carriersWithSettings, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching organization carrier settings:', error);
    return Response.json({ error: 'Failed to fetch organization settings' }, { status: 500, headers: corsHeaders() });
  }
});

// Update organization carrier setting (admin only)
router.post('/api/carriers/organization-settings', async (request, env: Env) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 401, headers: corsHeaders() });
    }

    // Get organization ID from headers
    const organizationId = request.headers.get('X-Organization-Id');
    if (!organizationId) {
      return Response.json({ error: 'Organization ID required' }, { status: 400, headers: corsHeaders() });
    }

    // TODO: Verify user is admin in this organization using Clerk
    // For now, we'll allow all authenticated users to access this endpoint
    // In production, you'd verify the user's role in their organization

    const { carrierId, enabled } = await request.json();
    if (!carrierId || typeof enabled !== 'boolean') {
      return Response.json({ error: 'carrierId and enabled are required' }, { status: 400, headers: corsHeaders() });
    }

    // Upsert organization setting
    await env.DB.prepare(`
      INSERT INTO organization_carrier_settings (id, organization_id, carrier_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(organization_id, carrier_id) DO UPDATE SET
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      organizationId,
      carrierId,
      enabled,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return Response.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating organization carrier setting:', error);
    return Response.json({ error: 'Failed to update organization setting' }, { status: 500, headers: corsHeaders() });
  }
});

// Clerk webhook endpoint
router.post('/webhook', async (request, env: Env) => {
  // Simple webhook handler that just acknowledges receipt
  return Response.json(
    { received: true },
    { status: 200, headers: corsHeaders() }
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