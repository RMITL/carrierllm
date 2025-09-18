import React from 'react';
import { PricingTable, useUser, useOrganization, SignedIn, SignedOut, useClerk } from '@clerk/clerk-react';
import { Button } from '@carrierllm/ui';

export const OrganizationPricingSection = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { openSignUp } = useClerk();
  const appUrl = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';

  const handleSignUp = () => {
    // Store the selected plan type for after sign-up
    localStorage.setItem('selectedPlanType', 'organization');
    
    openSignUp({
      afterSignUpUrl: '/create-organization',
      appearance: {
        elements: {
          rootBox: 'mx-auto',
          card: 'shadow-lg'
        }
      }
    });
  };

  return (
    <section id="organization-pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Organization Pricing Plans
          </h2>
          <p className="text-xl text-gray-600">
            Scale your team with our organization-focused pricing plans
          </p>
        </div>

        <SignedOut>
          <div className="mb-8">
            <div className="mb-8">
              <PricingTable forOrganizations={true} />
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">Ready to set up your organization?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" onClick={handleSignUp}>
                  Start Organization Plan
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.href = '/#pricing'}
                >
                  View Individual Plans
                </Button>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {user && (
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!
                {organization && (
                  <span className="block text-sm text-gray-500 mt-1">
                    Managing pricing for: <strong>{organization.name}</strong>
                  </span>
                )}
              </p>
              <a href={appUrl} className="text-blue-600 hover:text-blue-700">
                Go to Dashboard →
              </a>
            </div>
          )}

          {/* Always show organization pricing on this dedicated page */}
          <PricingTable forOrganizations={true} />
        </SignedIn>
      </div>
    </section>
  );
};
