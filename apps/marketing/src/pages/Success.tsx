import React, { useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { Button, Card } from '@carrierllm/ui';
import { PRICING_PLANS, PlanKey } from '../lib/stripe';

export const Success: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  const searchParams = new URLSearchParams(window.location.search);
  const planKey = (searchParams.get('plan') || localStorage.getItem('selectedPlan')) as PlanKey;
  const plan = planKey ? PRICING_PLANS[planKey] : null;

  useEffect(() => {
    // Check if subscription is active in user/org metadata
    if (user) {
      const subscriptionData = organization?.publicMetadata?.subscription || user.publicMetadata?.subscription;
      console.log('Subscription data:', subscriptionData);
    }
  }, [user, organization]);

  const handleGoToApp = () => {
    window.location.href = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';
  };

  // If not logged in, redirect to sign up
  if (isLoaded && !user) {
    window.location.href = '/';
    return null;
  }

  // Success state - user is logged in with active subscription
  return (
    <div className="min-h-screen bg-[color:var(--color-gray-100)] flex items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--color-gray-900)]">
            Welcome to CarrierLLM!
          </h1>

          {organization ? (
            <>
              <p className="text-[color:var(--color-gray-600)]">
                Your organization "{organization.name}" is now active with the {plan?.name || 'Team'} plan.
              </p>
              <p className="text-sm text-[color:var(--color-gray-500)]">
                {plan?.seats || 5} seats included • Unlimited recommendations
              </p>
            </>
          ) : (
            <>
              <p className="text-[color:var(--color-gray-600)]">
                Your {plan?.name || 'Individual'} account is ready.
              </p>
              <p className="text-sm text-[color:var(--color-gray-500)]">
                {plan?.name === 'Individual' ? '200 recommendations/month included' : 'All features unlocked'}
              </p>
            </>
          )}

          <Button onClick={handleGoToApp} className="w-full">
            Go to Dashboard
          </Button>

          <p className="text-xs text-[color:var(--color-gray-500)]">
            You can manage your subscription from your account settings
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Success;