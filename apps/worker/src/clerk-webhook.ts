import { Webhook } from 'svix';
import { createAdminNotification, logAuditEvent, trackAnalyticsEvent } from './analytics/analytics-service';

interface ClerkWebhookEvent {
  type: string;
  data: any;
  object: string;
  id: string;
  created_at: number;
}

// Clerk webhook event types we handle
const HANDLED_EVENTS = new Set([
  'user.created',
  'user.updated',
  'user.deleted',
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.pastDue',
  'subscriptionItem.created',
  'subscriptionItem.updated',
  'subscriptionItem.active',
  'subscriptionItem.canceled',
  'subscriptionItem.ended',
  'subscriptionItem.pastDue',
  'subscriptionItem.freeTrialEnding',
  'session.created',
  'session.ended',
]);

/**
 * Verify Clerk webhook signature
 */
export async function verifyClerkWebhook(
  body: string,
  headers: Headers,
  signingSecret: string
): Promise<ClerkWebhookEvent | null> {
  try {
    const wh = new Webhook(signingSecret);

    // Get required headers
    const svixId = headers.get('svix-id');
    const svixTimestamp = headers.get('svix-timestamp');
    const svixSignature = headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing required Svix headers');
      return null;
    }

    // Verify the webhook
    const event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;

    return event;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return null;
  }
}

/**
 * Handle Clerk webhook events
 */
export async function handleClerkWebhook(
  event: ClerkWebhookEvent,
  env: any
): Promise<void> {
  // Only handle events we care about
  if (!HANDLED_EVENTS.has(event.type)) {
    console.log(`Ignoring unhandled event type: ${event.type}`);
    return;
  }

  console.log(`Processing Clerk webhook: ${event.type}`);

  // Log webhook event
  await env.DB.prepare(
    `INSERT INTO webhook_events (id, event_id, event_type, user_id, payload, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    event.id,
    event.type,
    event.data?.id || event.data?.user_id || null,
    JSON.stringify(event.data),
    'processing'
  ).run();

  try {
    switch (event.type) {
      case 'user.created': {
        const user = event.data;
        // Initialize user in our database
        await env.DB.prepare(
          `INSERT INTO users (id, email, created_at, metadata)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
           email = excluded.email,
           metadata = excluded.metadata`
        ).bind(
          user.id,
          user.email_addresses[0]?.email_address,
          new Date(user.created_at).toISOString(),
          JSON.stringify({
            firstName: user.first_name,
            lastName: user.last_name,
            planKey: user.public_metadata?.planKey || 'free_user',
            organizationId: user.organization_memberships?.[0]?.organization?.id,
          })
        ).run();

        // Send admin notification
        await createAdminNotification({
          type: 'user_signup',
          severity: 'info',
          userId: user.id,
          title: 'New User Signup',
          message: `New user registered: ${user.email_addresses[0]?.email_address} (Plan: ${user.public_metadata?.planKey || 'free_user'})`,
          metadata: { email: user.email_addresses[0]?.email_address, plan: user.public_metadata?.planKey },
          env
        });

        // Log audit event
        await logAuditEvent({
          userId: user.id,
          action: 'user_created',
          resourceType: 'user',
          resourceId: user.id,
          metadata: { source: 'clerk_webhook' },
          env
        });
        break;
      }

      case 'user.updated': {
        const user = event.data;
        // Update user metadata
        await env.DB.prepare(
          `UPDATE users
           SET metadata = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).bind(
          JSON.stringify({
            firstName: user.first_name,
            lastName: user.last_name,
            planKey: user.public_metadata?.planKey || 'free_user',
            monthlyUsage: user.public_metadata?.monthlyUsage || 0,
          }),
          user.id
        ).run();
        break;
      }

      case 'user.deleted': {
        const user = event.data;
        // Soft delete user data
        await env.DB.prepare(
          `UPDATE users
           SET deleted_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).bind(user.id).run();
        break;
      }

      case 'subscription.created':
      case 'subscription.active': {
        const subscription = event.data;
        const userId = subscription.user_id || subscription.metadata?.userId;

        // Log billing event
        await env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, plan_key, amount, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          userId,
          event.type,
          subscription.plan_key || subscription.metadata?.planKey,
          subscription.amount || 0,
          JSON.stringify(subscription)
        ).run();

        // Reset monthly usage on new subscription
        if (event.type === 'subscription.created') {
          await resetMonthlyUsage(userId, env);
        }

        // Send admin notification
        const planPrices = { 'individual': 50, 'enterprise': 150, 'extra_team_seat': 30 };
        const amount = planPrices[subscription.plan_key as keyof typeof planPrices] || 0;

        await createAdminNotification({
          type: 'subscription_change',
          severity: 'info',
          userId,
          title: event.type === 'subscription.created' ? 'New Subscription' : 'Subscription Activated',
          message: `User ${userId} ${event.type === 'subscription.created' ? 'subscribed to' : 'activated'} ${subscription.plan_key} plan ($${amount}/month)`,
          metadata: { plan: subscription.plan_key, amount },
          env
        });
        break;
      }

      case 'subscription.updated': {
        const subscription = event.data;
        // Log subscription update
        await env.DB.prepare(
          `INSERT INTO subscription_events (user_id, event_type, plan_key, metadata, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          subscription.user_id,
          event.type,
          subscription.plan_key,
          JSON.stringify(subscription),
          new Date().toISOString()
        ).run();
        break;
      }

      case 'subscription.pastDue': {
        const subscription = event.data;
        const userId = subscription.user_id || subscription.metadata?.userId;

        // Log billing event
        await env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, plan_key, metadata)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          userId,
          'payment_past_due',
          subscription.plan_key,
          JSON.stringify(subscription)
        ).run();

        // Send critical admin notification
        await createAdminNotification({
          type: 'payment_issue',
          severity: 'critical',
          userId,
          title: 'Payment Past Due',
          message: `User ${userId} has a past due subscription for ${subscription.plan_key} plan`,
          metadata: subscription,
          env
        });

        // Send user notification email
        if (env.RESEND_API_KEY) {
          await sendPaymentReminderEmail(userId, env);
        }
        break;
      }

      case 'subscriptionItem.canceled':
      case 'subscriptionItem.ended': {
        const item = event.data;
        // Handle subscription cancellation
        await env.DB.prepare(
          `INSERT INTO subscription_events (user_id, event_type, plan_key, metadata, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          item.user_id,
          event.type,
          'free_user', // Downgrade to free
          JSON.stringify(item),
          new Date().toISOString()
        ).run();
        break;
      }

      case 'subscriptionItem.freeTrialEnding': {
        const item = event.data;
        // Handle trial ending notification
        console.log(`Free trial ending for user ${item.user_id}`);

        // Could send notification email here
        if (env.RESEND_API_KEY) {
          // await sendTrialEndingNotification(item.user_id, env);
        }
        break;
      }

      case 'session.created': {
        const session = event.data;
        // Log user session for analytics
        await env.DB.prepare(
          `INSERT INTO user_sessions (user_id, session_id, created_at)
           VALUES (?, ?, ?)`
        ).bind(
          session.user_id,
          session.id,
          new Date(session.created_at).toISOString()
        ).run();
        break;
      }

      case 'session.ended': {
        const session = event.data;
        // Update session end time
        await env.DB.prepare(
          `UPDATE user_sessions
           SET ended_at = ?
           WHERE session_id = ?`
        ).bind(
          new Date().toISOString(),
          session.id
        ).run();
        break;
      }
    }

    // Mark webhook as completed
    await env.DB.prepare(
      `UPDATE webhook_events
       SET status = 'completed', processed_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`
    ).bind(event.id).run();

    console.log(`Successfully processed ${event.type} webhook`);
  } catch (error) {
    console.error(`Error processing ${event.type} webhook:`, error);

    // Mark webhook as failed
    await env.DB.prepare(
      `UPDATE webhook_events
       SET status = 'failed', error_message = ?, processed_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`
    ).bind(String(error), event.id).run();

    // Create error notification
    await createAdminNotification({
      type: 'webhook_error',
      severity: 'error',
      title: 'Webhook Processing Failed',
      message: `Failed to process ${event.type} webhook: ${error}`,
      metadata: { eventType: event.type, error: String(error) },
      env
    });

    throw error;
  }
}

/**
 * Reset monthly usage counter for a user
 */
async function resetMonthlyUsage(userId: string, env: any): Promise<void> {
  try {
    // Update user metadata to reset usage
    await env.DB.prepare(
      `UPDATE users
       SET metadata = json_set(metadata, '$.monthlyUsage', 0)
       WHERE id = ?`
    ).bind(userId).run();

    console.log(`Reset monthly usage for user ${userId}`);
  } catch (error) {
    console.error(`Failed to reset usage for user ${userId}:`, error);
  }
}

/**
 * Send payment reminder email
 */
async function sendPaymentReminderEmail(userId: string, env: any): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  try {
    const user = await env.DB.prepare(
      `SELECT email FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user?.email) return;

    const resend = await import('resend');
    const client = new resend.Resend(env.RESEND_API_KEY);

    await client.emails.send({
      from: 'CarrierLLM Billing <billing@carrierllm.com>',
      to: user.email,
      subject: 'Payment Past Due - Action Required',
      html: `
        <h2>Your CarrierLLM subscription payment is past due</h2>
        <p>We were unable to process your recent payment. Please update your payment method to continue using CarrierLLM.</p>
        <p style="margin: 20px 0;">
          <a href="${env.APP_URL}/billing" style="display:inline-block;padding:10px 20px;background:#EF4444;color:white;text-decoration:none;border-radius:5px;">
            Update Payment Method
          </a>
        </p>
        <p>If you've already updated your payment information, please disregard this message.</p>
        <p style="margin-top:20px;color:#6B7280;font-size:12px;">
          Your access may be limited until payment is received. Contact support if you need assistance.
        </p>
      `
    });
  } catch (error) {
    console.error('Failed to send payment reminder email:', error);
  }
}

/**
 * Monthly cron job to reset usage for all users
 */
export async function resetAllMonthlyUsage(env: any): Promise<void> {
  try {
    const result = await env.DB.prepare(
      `UPDATE users
       SET metadata = json_set(metadata, '$.monthlyUsage', 0)
       WHERE deleted_at IS NULL`
    ).run();

    console.log(`Reset monthly usage for ${result.changes} users`);

    // Create admin notification
    await createAdminNotification({
      type: 'system_event',
      severity: 'info',
      title: 'Monthly Usage Reset',
      message: `Successfully reset monthly usage for ${result.changes} users`,
      metadata: { userCount: result.changes },
      env
    });
  } catch (error) {
    console.error('Failed to reset monthly usage:', error);

    await createAdminNotification({
      type: 'system_error',
      severity: 'error',
      title: 'Monthly Usage Reset Failed',
      message: `Failed to reset monthly usage: ${error}`,
      metadata: { error: String(error) },
      env
    });
  }
}