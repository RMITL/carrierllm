import { createClerkClient } from '@clerk/backend';

interface Env {
  CLERK_SECRET_KEY: string;
  DB: D1Database;
}

// Initialize Clerk client
export function initClerk(env: Env) {
  return createClerkClient({
    secretKey: env.CLERK_SECRET_KEY
  });
}

// Verify JWT token from Clerk
export async function verifyClerkToken(token: string, env: Env) {
  try {
    const clerk = initClerk(env);
    const verifiedToken = await clerk.verifyToken(token);
    return verifiedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get user's organization and subscription details
export async function getUserSubscriptionFromClerk(userId: string, env: Env) {
  try {
    const clerk = initClerk(env);

    // Get user details
    const user = await clerk.users.getUser(userId);

    // Get organization memberships
    const memberships = await clerk.users.getOrganizationMembershipList({
      userId
    });

    if (memberships.totalCount === 0) {
      // User has no organization - they're on individual plan or free
      const subscription = user.publicMetadata?.subscription || {};
      return {
        plan: subscription.plan || 'free',
        seats: 1,
        organizationId: null,
        organizationName: null,
        role: 'owner',
        status: subscription.status || 'active'
      };
    }

    // Get primary organization
    const primaryMembership = memberships.data[0];
    const organization = await clerk.organizations.getOrganization({
      organizationId: primaryMembership.organization.id
    });

    // Organization's subscription metadata
    const subscription = organization.publicMetadata?.subscription || {};

    return {
      plan: subscription.plan || 'team',
      seats: subscription.seats || 5,
      organizationId: organization.id,
      organizationName: organization.name,
      role: primaryMembership.role,
      status: subscription.status || 'active',
      usedSeats: organization.membersCount || 0,
      maxSeats: subscription.maxSeats || 5
    };
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    return {
      plan: 'free',
      seats: 0,
      organizationId: null,
      organizationName: null,
      role: 'member',
      status: 'inactive'
    };
  }
}

// Check if user has access to a feature based on their Clerk subscription
export async function checkClerkFeatureAccess(
  userId: string,
  feature: string,
  env: Env
): Promise<boolean> {
  const subscription = await getUserSubscriptionFromClerk(userId, env);

  const planFeatures: Record<string, string[]> = {
    free: ['basic_intake', 'limited_recommendations'],
    individual: ['full_intake', 'unlimited_recommendations', 'basic_analytics'],
    team: ['full_intake', 'unlimited_recommendations', 'advanced_analytics', 'team_collaboration', 'seat_management'],
    enterprise: ['all_features']
  };

  const features = planFeatures[subscription.plan] || planFeatures.free;

  // Check if subscription is active
  if (subscription.status !== 'active' && !features.includes('basic_intake')) {
    return false;
  }

  return features.includes('all_features') || features.includes(feature);
}

// Create or update organization subscription in Clerk
export async function updateOrganizationSubscription(
  organizationId: string,
  plan: string,
  seats: number,
  env: Env
) {
  try {
    const clerk = initClerk(env);

    await clerk.organizations.updateOrganizationMetadata(organizationId, {
      publicMetadata: {
        subscription: {
          plan,
          seats,
          maxSeats: seats,
          status: 'active',
          updatedAt: new Date().toISOString()
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to update organization subscription:', error);
    return false;
  }
}

// Create organization with subscription plan
export async function createOrganizationWithPlan(
  userId: string,
  name: string,
  plan: 'team' | 'enterprise',
  seats: number,
  env: Env
) {
  try {
    const clerk = initClerk(env);

    // Create organization
    const organization = await clerk.organizations.createOrganization({
      name,
      createdBy: userId,
      publicMetadata: {
        subscription: {
          plan,
          seats,
          maxSeats: seats,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      }
    });

    return organization;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
}

// Handle Clerk webhook events for subscription changes
export async function handleClerkWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const clerk = initClerk(env);

    // Verify webhook signature
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing webhook headers', { status: 400 });
    }

    const body = await request.text();
    const payload = JSON.parse(body);

    // Handle different event types
    switch (payload.type) {
      case 'user.created':
        // Set default plan for new users
        await clerk.users.updateUserMetadata(payload.data.id, {
          publicMetadata: {
            subscription: {
              plan: 'free',
              status: 'active'
            }
          }
        });
        break;

      case 'organization.created':
        // Sync organization to database
        await env.DB.prepare(`
          INSERT INTO tenants (id, clerk_organization_id, name, plan_type, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(clerk_organization_id) DO UPDATE SET
            name = ?,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          payload.data.id,
          payload.data.id,
          payload.data.name,
          payload.data.public_metadata?.subscription?.plan || 'team',
          payload.data.name
        ).run();
        break;

      case 'organizationMembership.created':
        // Track seat usage
        const orgId = payload.data.organization.id;
        const org = await clerk.organizations.getOrganization({ organizationId: orgId });
        const subscription = org.publicMetadata?.subscription || {};

        if (org.membersCount > (subscription.maxSeats || 5)) {
          // Handle seat overage - could trigger billing event
          console.warn(`Organization ${orgId} exceeds seat limit`);
        }
        break;
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response('Internal error', { status: 500 });
  }
}

// Middleware to check authentication and subscription
export async function requireAuth(request: Request, env: Env, requiredPlan?: string) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.substring(7);
  const verified = await verifyClerkToken(token, env);

  if (!verified) {
    return new Response('Invalid token', { status: 401 });
  }

  // Check subscription if plan is required
  if (requiredPlan) {
    const subscription = await getUserSubscriptionFromClerk(verified.sub, env);

    const planHierarchy = ['free', 'individual', 'team', 'enterprise'];
    const requiredIndex = planHierarchy.indexOf(requiredPlan);
    const userIndex = planHierarchy.indexOf(subscription.plan);

    if (userIndex < requiredIndex) {
      return new Response('Insufficient subscription', { status: 403 });
    }
  }

  return null; // Authentication successful
}