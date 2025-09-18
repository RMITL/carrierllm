// Use Web Crypto API for Cloudflare Workers
function uuidv4() {
  return crypto.randomUUID();
}

export interface AnalyticsEvent {
  userId: string;
  organizationId?: string;
  eventType: 'intake_submitted' | 'recommendation_generated' | 'placement_logged' | 'api_call';
  metadata?: Record<string, any>;
}

export interface UserMetrics {
  dailyUsage: number;
  monthlyUsage: number;
  quotaLimit: number;
  quotaRemaining: number;
  averageFitScore: number;
  placementRate: number;
}

export interface OrgMetrics {
  totalMembers: number;
  activeMembers: number;
  totalUsage: number;
  seatUtilization: number;
  topCarriers: Array<{ carrierId: string; count: number; successRate: number }>;
}

/**
 * Track analytics event for user and organization
 */
export async function trackAnalyticsEvent(
  event: AnalyticsEvent,
  env: any
): Promise<void> {
  const eventId = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    // Track in usage_tracking table
    await env.DB.prepare(
      `INSERT INTO usage_tracking (id, user_id, organization_id, event_type, event_details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      eventId,
      event.userId,
      event.organizationId || null,
      event.eventType,
      JSON.stringify(event.metadata || {}),
      timestamp
    ).run();

    // Update user analytics
    await updateUserAnalytics(event.userId, event.eventType, env);

    // Update org analytics if applicable
    if (event.organizationId) {
      await updateOrgAnalytics(event.organizationId, event.eventType, env);
    }

    // Check for usage alerts
    await checkUsageAlerts(event.userId, event.organizationId, env);

  } catch (error) {
    console.error('Failed to track analytics event:', error);
    // Log to audit for debugging
    await logAuditEvent({
      userId: event.userId,
      action: 'analytics_error',
      resourceType: 'analytics_event',
      metadata: { error: String(error), event },
      env
    });
  }
}

/**
 * Update user-level analytics
 */
async function updateUserAnalytics(
  userId: string,
  eventType: string,
  env: any
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Increment counters based on event type
  const updateField = eventType === 'intake_submitted' ? 'intakes_submitted' :
                      eventType === 'recommendation_generated' ? 'recommendations_generated' :
                      eventType === 'placement_logged' ? 'placements_successful' :
                      eventType === 'api_call' ? 'api_calls_made' : null;

  if (!updateField) return;

  await env.DB.prepare(
    `INSERT INTO user_analytics (id, user_id, period_start, period_end, ${updateField})
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(user_id, period_start, period_end)
     DO UPDATE SET
       ${updateField} = ${updateField} + 1,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(
    uuidv4(),
    userId,
    monthStartStr,
    today,

  ).run();
}

/**
 * Update organization-level analytics
 */
async function updateOrgAnalytics(
  orgId: string,
  eventType: string,
  env: any
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const updateField = eventType === 'intake_submitted' ? 'intakes_submitted' :
                      eventType === 'recommendation_generated' ? 'recommendations_generated' :
                      eventType === 'placement_logged' ? 'placements_successful' : null;

  if (!updateField) return;

  await env.DB.prepare(
    `INSERT INTO org_analytics (id, organization_id, period_start, period_end, ${updateField})
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(organization_id, period_start, period_end)
     DO UPDATE SET
       ${updateField} = ${updateField} + 1,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(
    uuidv4(),
    orgId,
    monthStartStr,
    today
  ).run();
}

/**
 * Check usage limits and create alerts if needed
 */
async function checkUsageAlerts(
  userId: string,
  orgId: string | undefined,
  env: any
): Promise<void> {
  // Get user's current usage
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const usage = await env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM usage_tracking
     WHERE user_id = ?
       AND event_type = 'recommendation_generated'
       AND timestamp >= ?`
  ).bind(userId, monthStartStr).first();

  // Get user's plan limits from Clerk metadata
  const userResult = await env.DB.prepare(
    `SELECT metadata FROM users WHERE id = ?`
  ).bind(userId).first();

  if (!userResult) return;

  const metadata = JSON.parse(userResult.metadata || '{}');
  const planKey = metadata.planKey || 'free_user';

  // Define plan limits
  const limits = {
    'free_user': 5,
    'individual': 100,
    'free_org': 10,
    'enterprise': -1 // unlimited
  };

  const limit = limits[planKey as keyof typeof limits] || 5;
  const currentUsage = usage?.count || 0;

  // Check thresholds for alerts
  if (limit > 0) {
    const usagePercent = (currentUsage / limit) * 100;

    // 80% usage warning
    if (usagePercent >= 80 && usagePercent < 90) {
      await createAdminNotification({
        type: 'usage_alert',
        severity: 'warning',
        userId,
        organizationId: orgId,
        title: 'Usage Limit Warning',
        message: `User ${userId} has used ${currentUsage}/${limit} recommendations (${Math.round(usagePercent)}%)`,
        metadata: { currentUsage, limit, usagePercent },
        env
      });
    }

    // 90% usage critical
    if (usagePercent >= 90 && usagePercent < 100) {
      await createAdminNotification({
        type: 'usage_alert',
        severity: 'critical',
        userId,
        organizationId: orgId,
        title: 'Critical Usage Alert',
        message: `User ${userId} is approaching limit: ${currentUsage}/${limit} recommendations`,
        metadata: { currentUsage, limit, usagePercent },
        env
      });

      // Also send email notification
      await sendUsageAlertEmail(userId, currentUsage, limit, env);
    }

    // 100% limit reached
    if (usagePercent >= 100) {
      await createAdminNotification({
        type: 'usage_alert',
        severity: 'error',
        userId,
        organizationId: orgId,
        title: 'Usage Limit Exceeded',
        message: `User ${userId} has exceeded their limit: ${currentUsage}/${limit} recommendations`,
        metadata: { currentUsage, limit, usagePercent },
        env
      });
    }
  }
}

/**
 * Create admin notification
 */
export async function createAdminNotification(params: {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  organizationId?: string;
  title: string;
  message: string;
  metadata?: any;
  env: any;
}): Promise<void> {
  const { type, severity, userId, organizationId, title, message, metadata, env } = params;

  await env.DB.prepare(
    `INSERT INTO admin_notifications
     (id, notification_type, severity, user_id, organization_id, title, message, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uuidv4(),
    type,
    severity,
    userId || null,
    organizationId || null,
    title,
    message,
    JSON.stringify(metadata || {})
  ).run();

  // For critical notifications, also send immediate email to admin
  if (severity === 'critical' || severity === 'error') {
    await sendAdminAlertEmail(title, message, severity, env);
  }
}

/**
 * Send usage alert email to user
 */
async function sendUsageAlertEmail(
  userId: string,
  currentUsage: number,
  limit: number,
  env: any
): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  try {
    // Get user email
    const user = await env.DB.prepare(
      `SELECT email FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user?.email) return;

    const resend = await import('resend');
    const client = new resend.Resend(env.RESEND_API_KEY);

    await client.emails.send({
      from: 'CarrierLLM <notifications@carrierllm.com>',
      to: user.email,
      subject: 'Usage Limit Alert - CarrierLLM',
      html: `
        <h2>You're approaching your monthly limit</h2>
        <p>You've used <strong>${currentUsage} of ${limit}</strong> recommendations this month.</p>
        <p>To continue using CarrierLLM without interruption, consider upgrading your plan:</p>
        <a href="${env.APP_URL}/pricing" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:white;text-decoration:none;border-radius:5px;">
          Upgrade Plan
        </a>
        <p style="margin-top:20px;color:#6B7280;font-size:12px;">
          You can manage your subscription at any time from your account settings.
        </p>
      `
    });
  } catch (error) {
    console.error('Failed to send usage alert email:', error);
  }
}

/**
 * Send admin alert email
 */
async function sendAdminAlertEmail(
  title: string,
  message: string,
  severity: string,
  env: any
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL) return;

  try {
    const resend = await import('resend');
    const client = new resend.Resend(env.RESEND_API_KEY);

    const severityColor = severity === 'critical' ? '#EF4444' :
                          severity === 'error' ? '#F59E0B' :
                          severity === 'warning' ? '#3B82F6' : '#10B981';

    await client.emails.send({
      from: 'CarrierLLM Alerts <alerts@carrierllm.com>',
      to: env.ADMIN_EMAIL,
      subject: `[${severity.toUpperCase()}] ${title}`,
      html: `
        <div style="border-left: 4px solid ${severityColor}; padding-left: 16px;">
          <h2>${title}</h2>
          <p>${message}</p>
          <p style="margin-top:20px;">
            <a href="${env.APP_URL}/admin/notifications" style="color:#3B82F6;">
              View all notifications →
            </a>
          </p>
        </div>
        <p style="margin-top:20px;color:#6B7280;font-size:12px;">
          This is an automated alert from CarrierLLM monitoring system.
        </p>
      `
    });
  } catch (error) {
    console.error('Failed to send admin alert email:', error);
  }
}

/**
 * Log audit event for compliance
 */
export async function logAuditEvent(params: {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  env: any;
}): Promise<void> {
  const { userId, action, resourceType, resourceId, ipAddress, userAgent, metadata, env } = params;

  await env.DB.prepare(
    `INSERT INTO audit_log
     (id, user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    uuidv4(),
    userId,
    action,
    resourceType || null,
    resourceId || null,
    ipAddress || null,
    userAgent || null,
    JSON.stringify(metadata || {})
  ).run();
}

/**
 * Get user analytics summary
 */
export async function getUserAnalytics(
  userId: string,
  env: any
): Promise<UserMetrics> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Get current month analytics
  const analytics = await env.DB.prepare(
    `SELECT * FROM user_analytics
     WHERE user_id = ? AND period_start = ?`
  ).bind(userId, monthStartStr).first();

  // Get user metadata for limits
  const user = await env.DB.prepare(
    `SELECT metadata FROM users WHERE id = ?`
  ).bind(userId).first();

  const metadata = JSON.parse(user?.metadata || '{}');
  const planKey = metadata.planKey || 'free_user';

  const limits = {
    'free_user': 5,
    'individual': 100,
    'free_org': 10,
    'enterprise': 999
  };

  const limit = limits[planKey as keyof typeof limits] || 5;
  const monthlyUsage = analytics?.recommendations_generated || 0;

  // Calculate placement rate
  const placementRate = analytics?.intakes_submitted > 0
    ? (analytics.placements_successful / analytics.intakes_submitted) * 100
    : 0;

  return {
    dailyUsage: 0, // TODO: Implement daily tracking
    monthlyUsage,
    quotaLimit: limit,
    quotaRemaining: Math.max(0, limit - monthlyUsage),
    averageFitScore: analytics?.average_fit_score || 0,
    placementRate
  };
}

/**
 * Get organization analytics summary
 */
export async function getOrgAnalytics(
  orgId: string,
  env: any
): Promise<OrgMetrics> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Get org analytics
  const analytics = await env.DB.prepare(
    `SELECT * FROM org_analytics
     WHERE organization_id = ? AND period_start = ?`
  ).bind(orgId, monthStartStr).first();

  // Get member count
  const members = await env.DB.prepare(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN json_extract(metadata, '$.lastActive') > datetime('now', '-7 days') THEN 1 END) as active
     FROM users
     WHERE json_extract(metadata, '$.organizationId') = ?`
  ).bind(orgId).first();

  // Parse top carriers
  const topCarriers = analytics?.top_carriers
    ? JSON.parse(analytics.top_carriers)
    : [];

  return {
    totalMembers: members?.total || 0,
    activeMembers: members?.active || 0,
    totalUsage: analytics?.recommendations_generated || 0,
    seatUtilization: analytics?.seat_utilization || 0,
    topCarriers
  };
}

/**
 * Track performance metrics
 */
export async function trackPerformance(
  metricType: string,
  value: number,
  metadata: any,
  env: any
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO performance_metrics (id, metric_type, endpoint, user_id, value, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    uuidv4(),
    metricType,
    metadata.endpoint || null,
    metadata.userId || null,
    value,
    JSON.stringify(metadata)
  ).run();

  // Check for performance issues
  if (metricType === 'api_latency' && value > 4000) {
    await createAdminNotification({
      type: 'performance_alert',
      severity: 'warning',
      title: 'High API Latency Detected',
      message: `API latency exceeded 4s: ${value}ms for ${metadata.endpoint}`,
      metadata: { latency: value, ...metadata },
      env
    });
  }
}