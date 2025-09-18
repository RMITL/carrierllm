import React from 'react';
import { PricingTable, useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Button } from '@carrierllm/ui';

export const ClerkPricingSection = () => {
  const { user } = useUser();
  const appUrl = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';

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
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">Sign in to view pricing and subscribe</p>
            <SignInButton mode="modal" afterSignInUrl={appUrl}>
              <Button variant="primary">Sign In to View Plans</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {user && (
            <div className="mb-8 text-center">
              <p className="text-gray-600">Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!</p>
              <a href={appUrl} className="text-blue-600 hover:text-blue-700">
                Go to Dashboard →
              </a>
            </div>
          )}

          <PricingTable />
        </SignedIn>
      </div>
    </section>
  );
};