import React, { useState } from 'react';
import { Button, Card } from '@carrierllm/ui';
import { useClerk, useUser, useOrganization } from '@clerk/clerk-react';
import { PRICING_PLANS, PlanKey } from '../lib/stripe';

interface PricingCardProps {
  planKey: PlanKey;
  isPopular?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ planKey, isPopular = false }) => {
  const [loading, setLoading] = useState(false);
  const plan = PRICING_PLANS[planKey];
  const { openSignUp, openSignIn } = useClerk();
  const { user } = useUser();

  const handleSubscribe = async () => {
    if (planKey === 'enterprise') {
      // Handle enterprise contact
      window.open('mailto:info@carrierllm.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    // Store selected plan for after sign-up
    localStorage.setItem('selectedPlan', planKey);

    // If user not signed in, open Clerk sign up with redirect
    if (!user) {
      openSignUp({
        afterSignUpUrl: `/checkout?plan=${planKey}`,
        appearance: {
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg'
          }
        }
      });
      return;
    }

    // User is signed in - redirect to Clerk's checkout
    // For Individual plan - direct checkout
    // For Team plan - create organization first
    setLoading(true);
    try {
      if (planKey === 'team' && !user.organizationMemberships?.length) {
        // Need to create organization for team plan
        window.location.href = `/create-organization?plan=${planKey}`;
      } else {
        // Redirect to Clerk's subscription checkout
        const checkoutUrl = `https://accounts.${window.location.hostname.includes('localhost') ? 'development' : 'production'}.clerk.dev/subscription/checkout`;
        const params = new URLSearchParams({
          redirect_url: `${window.location.origin}/success`,
          plan: planKey,
          price_id: plan.priceId
        });
        window.location.href = `${checkoutUrl}?${params}`;
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('There was an error processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = planKey === 'enterprise' ? 'Contact Sales' : loading ? 'Loading...' : 'Get Started';
  const variant = isPopular ? 'primary' : 'secondary';

  return (
    <div className="relative">
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-[color:var(--color-primary)] text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <Card
        className={`h-full ${isPopular ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-50' : ''}`}
        title={plan.name}
        description={
          <div className="space-y-2">
            <div className="text-3xl font-bold text-[color:var(--color-gray-900)]">
              {plan.price}
              {planKey !== 'enterprise' && <span className="text-base font-normal text-[color:var(--color-gray-500)]">/month</span>}
            </div>
          </div>
        }
        footer={
          <Button
            variant={variant}
            className="w-full"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {buttonText}
          </Button>
        }
      >
        <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-gray-600)]">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-[color:var(--color-primary)] mr-2 mt-0.5">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};