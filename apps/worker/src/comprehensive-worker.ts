// Comprehensive worker with all necessary endpoints using native fetch API

import {
  sendOrganizationWelcomeEmail,
  sendTeamWelcomeEmail,
  sendOrganizationInvitationEmail,
  sendTrialEndingEmail,
  sendPaymentConfirmationEmail,
  sendUserWelcomeEmail,
  sendRoleChangeNotification,
  sendSecurityNotification,
  sendPaymentReminderEmail,
  sendCancellationConfirmationEmail,
  sendPaymentFailedEmail
} from './clerk-email-notifications';

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

      // Analytics endpoint with live data
      if (path === '/api/analytics/summary' && method === 'GET') {
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

        let topCarriers: any[] = [];
        let trends: any[] = [];

        try {
          // Get total intakes - check multiple tables for compatibility
          const intakesResult = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM (
              SELECT id FROM intakes
              UNION ALL
              SELECT id FROM intake_submissions
            )
          `).first();

          stats.totalIntakes = (intakesResult as { count: number })?.count || 0;

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
              
              const limit = (userProfile as { recommendations_limit: number })?.recommendations_limit || 0;
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

              if ((avgScore as { avg: number })?.avg) {
                stats.averageFitScore = Math.round((avgScore as { avg: number }).avg);
              } else {
                stats.averageFitScore = 0;
              }
            } catch (e) {
              console.log('Could not get average score:', e);
            }

            // Get top carriers for this user
            try {
              const topCarriersResult = await env.DB.prepare(`
                SELECT carrier_name, COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                GROUP BY carrier_name
                ORDER BY count DESC
                LIMIT 5
              `).bind(userId).all();

              topCarriers = topCarriersResult.results || [];
            } catch (e) {
              console.log('Could not get top carriers:', e);
            }

            // Get trends (monthly data for the last 6 months)
            try {
              const trendsResult = await env.DB.prepare(`
                SELECT 
                  strftime('%Y-%m', created_at) as month,
                  COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month
              `).bind(userId).all();

              trends = trendsResult.results || [];
            } catch (e) {
              console.log('Could not get trends:', e);
            }
          }

          // Get placement rate (if outcomes table exists)
          try {
            const placements = await env.DB.prepare(`
              SELECT 
                COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                COUNT(*) as total
              FROM outcomes
            `).first();

            if ((placements as { total: number; placed: number })?.total > 0) {
              const placementData = placements as { total: number; placed: number };
              stats.placementRate = Math.round((placementData.placed / placementData.total) * 100);
            } else {
              stats.placementRate = 0;
            }
          } catch (e) {
            console.log('Could not get placement rate:', e);
          }

        } catch (dbError) {
          console.error('Database error in analytics:', dbError);
        }

        return new Response(JSON.stringify({
          stats,
          topCarriers,
          trends
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

      // Get user history
      if (path === '/api/user/history' && method === 'GET') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        try {
          // First try to get from recommendations table
          let history;
          try {
            history = await env.DB.prepare(`
              SELECT 
                r.id,
                r.submission_id,
                r.carrier_name,
                r.fit_score,
                r.created_at,
                i.data as intake_data
              FROM recommendations r
              LEFT JOIN intakes i ON r.submission_id = i.id
              WHERE r.user_id = ?
              ORDER BY r.created_at DESC
              LIMIT 50
            `).bind(userId).all();
          } catch (tableError) {
            console.log('Recommendations table not found, trying intakes table:', tableError);
            // Fallback to intakes table if recommendations doesn't exist
            history = await env.DB.prepare(`
              SELECT 
                id,
                id as submission_id,
                'Unknown Carrier' as carrier_name,
                0 as fit_score,
                created_at,
                data as intake_data
              FROM intakes
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT 50
            `).bind(userId).all();
          }

          const formattedHistory = history.results.map((item: any) => ({
            id: item.id,
            submissionId: item.submission_id,
            carrierName: item.carrier_name,
            fitScore: item.fit_score,
            createdAt: item.created_at,
            intakeData: item.intake_data ? JSON.parse(item.intake_data) : null
          }));

          return new Response(JSON.stringify(formattedHistory), { 
            headers: corsHeaders() 
          });
        } catch (error) {
          console.error('Error fetching user history:', error);
          // Return empty array instead of error to prevent frontend crashes
          return new Response(JSON.stringify([]), { 
            headers: corsHeaders() 
          });
        }
      }

      // Submit intake
      if (path === '/api/intake/submit' && method === 'POST') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        try {
          const intakeData = await request.json();
          console.log('Received intake data:', JSON.stringify(intakeData, null, 2));
          const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Store intake data - match actual table structure
          await env.DB.prepare(`
            INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            submissionId, 
            request.headers.get('X-Organization-Id') || 'default', 
            JSON.stringify(intakeData),
            intakeData.validated || false,
            intakeData.tier2Triggered || false,
            userId
          ).run();

          // For now, return empty recommendations (RAG system would be implemented here)
          const recommendations: any[] = [];

          // Store recommendations
          for (const rec of recommendations) {
            try {
              await env.DB.prepare(`
                INSERT INTO recommendations (user_id, submission_id, carrier_name, fit_score, 
                                          reasons, advisories, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                userId,
                submissionId,
                rec.carrierName,
                rec.fitScore,
                JSON.stringify(rec.reasons),
                JSON.stringify(rec.advisories)
              ).run();
            } catch (e) {
              console.log('Could not store recommendation:', e);
            }
          }

          return new Response(JSON.stringify({
            submissionId,
            recommendations: recommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error('Error processing intake:', error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          return new Response(JSON.stringify({ 
            error: 'Failed to process intake', 
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }), { 
            status: 500, 
            headers: corsHeaders() 
          });
        }
      }

      // Get recommendations
      if (path.startsWith('/api/recommendations/') && method === 'GET') {
        const submissionId = path.split('/')[3];
        const userId = request.headers.get('X-User-Id');
        
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        try {
          const recommendations = await env.DB.prepare(`
            SELECT carrier_name, fit_score, reasons, advisories, created_at
            FROM recommendations
            WHERE submission_id = ? AND user_id = ?
            ORDER BY fit_score DESC
          `).bind(submissionId, userId).all();

          const formattedRecommendations = recommendations.results.map((rec: any) => ({
            carrierName: rec.carrier_name,
            fitScore: rec.fit_score,
            reasons: rec.reasons ? JSON.parse(rec.reasons) : [],
            advisories: rec.advisories ? JSON.parse(rec.advisories) : [],
            createdAt: rec.created_at
          }));

          return new Response(JSON.stringify({
            submissionId,
            recommendations: formattedRecommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error('Error fetching recommendations:', error);
          return new Response(JSON.stringify({ error: 'Failed to fetch recommendations' }), { 
            status: 500, 
            headers: corsHeaders() 
          });
        }
      }

      // Log outcome
      if (path === '/api/outcomes' && method === 'POST') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        try {
          const { submissionId, carrierName, status, notes } = await request.json();
          
          await env.DB.prepare(`
            INSERT INTO outcomes (user_id, submission_id, carrier_name, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(userId, submissionId, carrierName, status, notes || '').run();

          return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error('Error logging outcome:', error);
          return new Response(JSON.stringify({ error: 'Failed to log outcome' }), { 
            status: 500, 
            headers: corsHeaders() 
          });
        }
      }

      // Clerk webhook endpoint with security and rate limiting
      if (path === '/webhook' && method === 'POST') {
        try {
          // Verify webhook signature for security
          const svixId = request.headers.get('svix-id');
          const svixTimestamp = request.headers.get('svix-timestamp');
          const svixSignature = request.headers.get('svix-signature');

          if (!svixId || !svixTimestamp || !svixSignature) {
            console.error('Missing Clerk webhook headers');
            return new Response('Missing webhook headers', { 
              status: 400, 
              headers: corsHeaders() 
            });
          }

          // Basic rate limiting (simple implementation)
          const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
          const rateLimitKey = `webhook_rate_limit_${clientIP}`;
          
          // Check if we've exceeded rate limit (10 requests per minute per IP)
          const rateLimitCheck = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM webhook_rate_limits 
            WHERE ip_address = ? AND created_at > datetime('now', '-1 minute')
          `).bind(clientIP).first();

          if ((rateLimitCheck as any)?.count > 10) {
            console.error(`Rate limit exceeded for IP: ${clientIP}`);
            return new Response('Rate limit exceeded', { 
              status: 429, 
              headers: corsHeaders() 
            });
          }

          // Record this request for rate limiting
          await env.DB.prepare(`
            INSERT INTO webhook_rate_limits (ip_address, created_at)
            VALUES (?, datetime('now'))
          `).bind(clientIP).run();

          const body = await request.text();
          const event = JSON.parse(body);

          console.log(`Received Clerk webhook: ${event.type} from IP: ${clientIP}`);

          // Handle organization events for team management
          switch (event.type) {
            // User Events
            case 'user.created': {
              const user = event.data;
              console.log(`New user created: ${user.email_addresses?.[0]?.email_address || 'unknown'} (${user.id})`);
              
              // Send welcome email to new user
              if (env.RESEND_API_KEY && user.email_addresses?.[0]?.email_address) {
                await sendUserWelcomeEmail(user, env);
              }
              break;
            }

            case 'user.updated': {
              const user = event.data;
              console.log(`User updated: ${user.email_addresses?.[0]?.email_address || 'unknown'} (${user.id})`);
              
              // Log user changes for audit trail
              await logUserChanges(user, env);
              break;
            }

            // Organization Events
            case 'organization.created': {
              const org = event.data;
              console.log(`New organization created: ${org.name} (${org.id})`);
              
              // Send welcome email to organization admin
              if (env.RESEND_API_KEY && org.created_by) {
                await sendOrganizationWelcomeEmail(org, env);
              }
              break;
            }

            case 'organizationMembership.created': {
              const membership = event.data;
              console.log(`User ${membership.public_user_data?.identifier} joined organization ${membership.organization.name}`);
              
              // Send welcome email to new team member
              if (env.RESEND_API_KEY && membership.public_user_data?.user_id) {
                await sendTeamWelcomeEmail(membership, env);
              }
              break;
            }

            case 'organizationMembership.updated': {
              const membership = event.data;
              console.log(`Organization membership updated: ${membership.public_user_data?.identifier} role changed to ${membership.role_name}`);
              
              // Send role change notification
              if (env.RESEND_API_KEY && membership.public_user_data?.user_id) {
                await sendRoleChangeNotification(membership, env);
              }
              break;
            }

            case 'organizationInvitation.created': {
              const invitation = event.data;
              console.log(`Invitation sent to ${invitation.email_address} for organization`);
              
              // Send invitation email
              if (env.RESEND_API_KEY) {
                await sendOrganizationInvitationEmail(invitation, env);
              }
              break;
            }

            // Session Events
            case 'session.created': {
              const session = event.data;
              console.log(`Session created for user ${session.user_id}`);
              
              // Track user activity for engagement analytics
              await trackUserSession(session, env);
              break;
            }

            case 'session.revoked': {
              const session = event.data;
              console.log(`Session revoked for user ${session.user_id}`);
              
              // Send security notification for revoked sessions
              if (env.RESEND_API_KEY) {
                await sendSecurityNotification(session, env);
              }
              break;
            }

            // Subscription Events
            case 'subscriptionItem.freeTrialEnding': {
              const item = event.data;
              console.log(`Free trial ending for subscription ${item.subscription_id}`);
              
              // Send trial ending notification
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendTrialEndingEmail(item, env);
              }
              break;
            }

            case 'subscriptionItem.pastDue': {
              const item = event.data;
              console.log(`Subscription past due for ${item.subscription_id}`);
              
              // Send payment reminder
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendPaymentReminderEmail(item, env);
              }
              break;
            }

            case 'subscriptionItem.canceled': {
              const item = event.data;
              console.log(`Subscription canceled for ${item.subscription_id}`);
              
              // Send cancellation confirmation
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendCancellationConfirmationEmail(item, env);
              }
              break;
            }

            // Payment Events
            case 'paymentAttempt.created': {
              const payment = event.data;
              console.log(`Payment attempt created: ${payment.status}`);
              
              // Send payment confirmation
              if (env.RESEND_API_KEY && payment.status === 'paid' && payment.payer?.user_id) {
                await sendPaymentConfirmationEmail(payment, env);
              }
              break;
            }

            case 'paymentAttempt.updated': {
              const payment = event.data;
              console.log(`Payment attempt updated: ${payment.status}`);
              
              // Handle failed payments
              if (env.RESEND_API_KEY && payment.status === 'failed' && payment.payer?.user_id) {
                await sendPaymentFailedEmail(payment, env);
              }
              break;
            }

            default:
              console.log(`Unhandled webhook event: ${event.type}`);
          }

          // Log webhook event for audit trail
          await logWebhookEvent(event, env);

          return new Response(JSON.stringify({ received: true }), { 
            headers: corsHeaders() 
          });
        } catch (error) {
          console.error('Webhook processing error:', error);
          return new Response(JSON.stringify({ 
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : String(error)
          }), { 
            status: 500, 
            headers: corsHeaders() 
          });
        }
      }

      // Get user subscription/usage info
      if (path.startsWith('/api/subscriptions/') && method === 'GET') {
        const userId = request.headers.get('X-User-Id');
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), { 
            status: 401, 
            headers: corsHeaders() 
          });
        }

        try {
          // For now, return default free tier data
          // In a real implementation, this would query Clerk's billing API or a subscriptions table
          const subscriptionData = {
            plan: { name: 'Free' },
            subscription: { status: 'active' },
            usage: { 
              current: 0, 
              limit: 5 
            }
          };

          return new Response(JSON.stringify(subscriptionData), { 
            headers: corsHeaders() 
          });
        } catch (error) {
          console.error('Error fetching subscription data:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch subscription data',
            details: error instanceof Error ? error.message : String(error)
          }), { 
            status: 500, 
            headers: corsHeaders() 
          });
        }
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

// Helper functions for webhook processing
async function logUserChanges(user: any, env: Env): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO user_audit_log (user_id, action, changes, created_at)
      VALUES (?, 'profile_updated', ?, datetime('now'))
    `).bind(user.id, JSON.stringify(user)).run();
  } catch (error) {
    console.error('Failed to log user changes:', error);
  }
}

async function trackUserSession(session: any, env: Env): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      session.user_id,
      session.id,
      session.latest_activity?.ip_address || 'unknown',
      session.latest_activity?.browser_name || 'unknown'
    ).run();
  } catch (error) {
    console.error('Failed to track user session:', error);
  }
}

async function logWebhookEvent(event: any, env: Env): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO webhook_events (event_id, event_type, user_id, payload, status, created_at)
      VALUES (?, ?, ?, ?, 'processed', datetime('now'))
    `).bind(
      event.id,
      event.type,
      event.data?.id || event.data?.user_id || null,
      JSON.stringify(event)
    ).run();
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}
