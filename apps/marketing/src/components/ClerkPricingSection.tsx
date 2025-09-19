import React, { useState, useEffect } from 'react';
import { PricingTable, useUser, useOrganization, SignedIn, SignedOut, SignInButton, useClerk } from '@clerk/clerk-react';
import { Button } from '@carrierllm/ui';
import { logger } from '../lib/logger';
import { EnhancedMarketingPricingTable } from './EnhancedMarketingPricingTable';

export const ClerkPricingSection = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { openSignUp } = useClerk();
  const [selectedPlanType, setSelectedPlanType] = useState<'individual' | 'organization'>('individual');
  const [billingError, setBillingError] = useState<string | null>(null);
  const appUrl = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';

  // Determine if we should show organization pricing or individual pricing for signed-in users
  // Show organization pricing if user is currently in an organization context
  const isOrganizationContext = !!organization;

  // Log component mount and user context
  useEffect(() => {
    logger.billingInfo('ClerkPricingSection loaded', {
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      organizationId: organization?.id,
      isOrganizationContext,
      selectedPlanType,
    });
  }, [user, organization, isOrganizationContext, selectedPlanType]);

  // Monitor Clerk billing state
  useEffect(() => {
    const checkBillingState = () => {
      try {
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
    const interval = setInterval(checkBillingState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignUp = (planType: 'individual' | 'organization') => {
    logger.billingInfo('User initiated sign up', { planType });
    
    try {
      // Store the selected plan type for after sign-up
      localStorage.setItem('selectedPlanType', planType);
      
      openSignUp({
        afterSignUpUrl: planType === 'organization' ? '/create-organization' : appUrl,
        appearance: {
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg'
          }
        }
      });
    } catch (error) {
      logger.billingError('Error opening sign up modal', { error, planType });
      setBillingError('Unable to open sign up form. Please try again or contact support.');
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for your insurance agency
          </p>
        </div>

        <SignedOut>
          {/* Show both individual and organization pricing to unauthenticated users */}
          <div className="mb-8">
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

            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-sm border">
                <button
                  onClick={() => {
                    setSelectedPlanType('individual');
                    logger.billingInfo('User selected individual plans');
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPlanType === 'individual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Individual Plans
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanType('organization');
                    logger.billingInfo('User selected organization plans');
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPlanType === 'organization'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Organization Plans
                </button>
              </div>
            </div>

            <div className="mb-8">
              <EnhancedMarketingPricingTable 
                forOrganizations={selectedPlanType === 'organization'}
                onError={setBillingError}
              />
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {selectedPlanType === 'individual' 
                  ? 'Ready to get started with an individual plan?'
                  : 'Ready to set up your organization?'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary" 
                  onClick={() => handleSignUp(selectedPlanType)}
                >
                  {selectedPlanType === 'individual' ? 'Start Individual Plan' : 'Start Organization Plan'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setSelectedPlanType(selectedPlanType === 'individual' ? 'organization' : 'individual')}
                >
                  View {selectedPlanType === 'individual' ? 'Organization' : 'Individual'} Plans
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
                {isOrganizationContext && organization && (
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

          {/* Show organization pricing if user is in organization context, otherwise show individual pricing */}
          <EnhancedMarketingPricingTable 
            forOrganizations={isOrganizationContext}
            onError={setBillingError}
          />
        </SignedIn>
      </div>
    </section>
  );
};