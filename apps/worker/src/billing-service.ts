/**
 * Comprehensive Billing and Usage Service
 * Handles subscription management, usage tracking, and plan-based access control
 */

export interface UserSubscription {
  plan: string;
  planName: string;
  status: string;
  recommendationsUsed: number;
  recommendationsLimit: number;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  isActive: boolean;
  billingType: 'individual' | 'organization';
}

export interface PlanLimits {
  free_user: { recommendations: 5; teamMembers: 1; price: 0 };
  free_org: { recommendations: 10; teamMembers: 2; price: 0 };
  individual: { recommendations: 100; teamMembers: 1; price: 50 };
  enterprise: { recommendations: 500; teamMembers: 5; price: 150 };
}

const PLAN_LIMITS: PlanLimits = {
  free_user: { recommendations: 5, teamMembers: 1, price: 0 },
  free_org: { recommendations: 10, teamMembers: 2, price: 0 },
  individual: { recommendations: 100, teamMembers: 1, price: 50 },
  enterprise: { recommendations: 500, teamMembers: 5, price: 150 }
};

/**
 * Get user's current subscription and usage
 */
export async function getUserSubscription(
  userId: string,
  env: any
): Promise<UserSubscription> {
  try {
    console.log(`Fetching subscription for user: ${userId}`);
    
    // Get current month for usage calculation
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Get user's current usage from recommendations table
    let currentUsage = 0;
    try {
      const usageResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM recommendations
        WHERE (user_id = ? OR user_id IS NULL) AND created_at >= ?
      `).bind(userId, monthStart).first();
      
      currentUsage = (usageResult as any)?.count || 0;
      console.log('User current usage:', currentUsage);
    } catch (e) {
      console.log('Could not get user usage:', e);
    }
    
    // Try to get subscription info from Clerk's API
    let planKey = 'free_user';
    let status = 'active';
    let organizationId = null;
    let organizationName = null;
    let role = 'member';
    
    try {
      // Call Clerk's API to get user subscription data
      const clerkApiKey = env.CLERK_SECRET_KEY;
      if (clerkApiKey) {
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${clerkApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (clerkResponse.ok) {
          const userData = await clerkResponse.json();
          planKey = userData.public_metadata?.planKey || 'free_user';
          status = userData.public_metadata?.subscription?.status || 'active';
          
          // Check if user has organization memberships
          const membershipsResponse = await fetch(`https://api.clerk.com/v1/users/${userId}/organization_memberships`, {
            headers: {
              'Authorization': `Bearer ${clerkApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (membershipsResponse.ok) {
            const memberships = await membershipsResponse.json();
            if (memberships.data && memberships.data.length > 0) {
              const membership = memberships.data[0];
              organizationId = membership.organization.id;
              organizationName = membership.organization.name;
              role = membership.role;
              
              // Get organization subscription
              const orgResponse = await fetch(`https://api.clerk.com/v1/organizations/${organizationId}`, {
                headers: {
                  'Authorization': `Bearer ${clerkApiKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                planKey = orgData.public_metadata?.subscription?.planKey || 'free_org';
                status = orgData.public_metadata?.subscription?.status || 'active';
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('Could not fetch Clerk subscription data:', e);
    }
    
    // Get plan limits
    const limits = PLAN_LIMITS[planKey as keyof PlanLimits] || PLAN_LIMITS.free_user;
    
    // Determine billing type
    const billingType = organizationId ? 'organization' : 'individual';
    
    const subscription: UserSubscription = {
      plan: planKey,
      planName: getPlanDisplayName(planKey),
      status,
      recommendationsUsed: currentUsage,
      recommendationsLimit: limits.recommendations,
      organizationId,
      organizationName,
      role,
      isActive: status === 'active',
      billingType
    };
    
    console.log(`Subscription for user ${userId}:`, subscription);
    return subscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    // Return default free tier on error
    return {
      plan: 'free_user',
      planName: 'Free',
      status: 'active',
      recommendationsUsed: 0,
      recommendationsLimit: 5,
      isActive: true,
      billingType: 'individual'
    };
  }
}

/**
 * Check if user can submit intake (usage limits)
 */
export async function canSubmitIntake(
  userId: string,
  env: any
): Promise<{ allowed: boolean; reason?: string; usage?: { used: number; limit: number } }> {
  try {
    const subscription = await getUserSubscription(userId, env);
    
    // Check if subscription is active
    if (!subscription.isActive) {
      return {
        allowed: false,
        reason: 'Subscription inactive',
        usage: { used: subscription.recommendationsUsed, limit: subscription.recommendationsLimit }
      };
    }
    
    // Check usage limits
    if (subscription.recommendationsUsed >= subscription.recommendationsLimit) {
      return {
        allowed: false,
        reason: 'Monthly recommendation limit reached',
        usage: { used: subscription.recommendationsUsed, limit: subscription.recommendationsLimit }
      };
    }
    
    return {
      allowed: true,
      usage: { used: subscription.recommendationsUsed, limit: subscription.recommendationsLimit }
    };
  } catch (error) {
    console.error('Error checking intake permission:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions'
    };
  }
}

/**
 * Increment usage after successful intake submission
 */
export async function incrementUsage(
  userId: string,
  env: any
): Promise<void> {
  try {
    console.log(`Incrementing usage for user: ${userId}`);
    
    // Update user profile usage
    await env.DB.prepare(`
      INSERT INTO user_profiles (user_id, subscription_status, subscription_tier, recommendations_used)
      VALUES (?, 'active', 'individual', 1)
      ON CONFLICT(user_id) DO UPDATE SET
      recommendations_used = recommendations_used + 1,
      updated_at = CURRENT_TIMESTAMP
    `).bind(userId).run();
    
    console.log(`Usage incremented for user: ${userId}`);
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Don't throw - usage tracking should not break the main flow
  }
}

/**
 * Get plan display name
 */
function getPlanDisplayName(planKey: string): string {
  switch (planKey) {
    case 'free_user': return 'Free';
    case 'free_org': return 'Free Organization';
    case 'individual': return 'Individual';
    case 'enterprise': return 'Enterprise';
    default: return 'Free';
  }
}

/**
 * Get plan limits for a given plan key
 */
export function getPlanLimits(planKey: string) {
  return PLAN_LIMITS[planKey as keyof PlanLimits] || PLAN_LIMITS.free_user;
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: string,
  env: any
): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId, env);
    
    switch (feature) {
      case 'intake_submission':
        return subscription.isActive && subscription.recommendationsUsed < subscription.recommendationsLimit;
      
      case 'analytics':
        return subscription.isActive;
      
      case 'team_management':
        return subscription.billingType === 'organization' && subscription.role === 'admin';
      
      case 'advanced_analytics':
        return subscription.plan === 'enterprise';
      
      default:
        return subscription.isActive;
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}
