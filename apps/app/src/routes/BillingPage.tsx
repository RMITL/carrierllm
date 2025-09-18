import { PricingTable } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Card, Badge, UsageMeter } from '@carrierllm/ui';
import { getUserUsage } from '../lib/api';
import { logger } from '../lib/logger';
import { BillingErrorBoundary } from '../components/ErrorBoundary';
import { EnhancedPricingTable } from '../components/EnhancedPricingTable';
import { useEffect, useState } from 'react';

export const BillingPage = () => {
  const { has } = useAuth();
  const { user } = useUser();
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const { data: usage, isLoading } = useQuery({
    queryKey: ['user-usage'],
    queryFn: getUserUsage
  });

  // Log page load and user context
  useEffect(() => {
    logger.billingInfo('BillingPage loaded', {
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      hasIndividualPlan: has?.({ plan: 'individual' }),
      hasEnterprisePlan: has?.({ plan: 'enterprise' }),
    });
  }, [user, has]);

  // Monitor Clerk billing state
  useEffect(() => {
    const checkBillingState = () => {
      try {
        // Check if Clerk billing is available
        if (typeof window !== 'undefined' && (window as any).Clerk?.billing) {
          logger.billingDebug('Clerk billing API available');
        } else {
          logger.billingWarn('Clerk billing API not available');
        }
      } catch (error) {
        logger.billingError('Error checking Clerk billing state', { error });
      }
    };

    checkBillingState();
    
    // Check periodically
    const interval = setInterval(checkBillingState, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check subscription status using Clerk's has() method
  const hasIndividualPlan = has?.({ plan: 'individual' });
  const hasEnterprisePlan = has?.({ plan: 'enterprise' });
  const hasAnyPlan = hasIndividualPlan || hasEnterprisePlan;

  // Get plan details
  const getCurrentPlan = () => {
    if (hasEnterprisePlan) return { name: 'Enterprise', limit: 500 };
    if (hasIndividualPlan) return { name: 'Individual', limit: 100 };
    return { name: 'Free', limit: 5 };
  };

  const currentPlan = getCurrentPlan();
  const usagePercentage = usage ? (usage.recommendationsUsed / currentPlan.limit) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your subscription and monitor your usage.
        </p>
      </div>

      {/* Current Usage */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Current Usage</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-gray-900">{currentPlan.name} Plan</p>
                <p className="text-sm text-gray-500">
                  {hasAnyPlan ? 'Active subscription' : 'Free tier'}
                </p>
              </div>
              <Badge variant={hasAnyPlan ? 'success' : 'warning'}>
                {hasAnyPlan ? 'Active' : 'Free'}
              </Badge>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Recommendations Used</span>
                <span className="text-sm text-gray-500">
                  {usage?.recommendationsUsed || 0} / {currentPlan.limit}
                </span>
              </div>
              <UsageMeter
                value={usagePercentage}
                label="Monthly usage"
              />
              {usagePercentage > 80 && (
                <p className="text-sm text-orange-600 mt-2">
                  You're approaching your monthly limit. Consider upgrading your plan below.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Subscription Plans - This is where users can upgrade/downgrade */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {hasAnyPlan ? 'Change Your Plan' : 'Choose a Plan'}
        </h2>
        
        {billingError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">Billing Error</div>
            <div className="text-red-600 text-sm mt-1">{billingError}</div>
            <button
              onClick={() => {
                setBillingError(null);
                logger.billingInfo('User dismissed billing error');
              }}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6">
          <BillingErrorBoundary>
            <EnhancedPricingTable 
              onError={setBillingError}
              onLoading={setIsBillingLoading}
            />
          </BillingErrorBoundary>
        </div>
        
        {isBillingLoading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing billing request...
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-500 mt-4 text-center">
          {hasAnyPlan
            ? 'Select a different plan above to upgrade or downgrade. Changes take effect immediately.'
            : 'Select a plan above to get started with CarrierLLM.'}
        </p>
      </div>

      {/* Billing FAQ */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-medium text-gray-900">How do I manage my subscription?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Use the pricing table above to change your plan. Your payment method and invoices are managed securely through Stripe.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-medium text-gray-900">When will I be charged?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Subscriptions are billed monthly on the same day you initially subscribed. Upgrades take effect immediately, downgrades at the next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Can I cancel anytime?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};