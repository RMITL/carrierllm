import { PricingTable, useOrganization } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { Card, Button } from '@carrierllm/ui';
import { useState } from 'react';

export const PricingPage = () => {
  const { has } = useAuth();
  const { organization } = useOrganization();
  const [showTeamSeats, setShowTeamSeats] = useState(false);

  // Check if user is on an organization plan
  const hasOrgPlan = has?.({ plan: 'free_org' }) || has?.({ plan: 'enterprise' });
  const isOrganizationContext = !!organization;

  const handleAddTeamSeat = () => {
    // This would trigger the extra_team_seat purchase through Clerk
    window.location.href = '/api/subscriptions/add-seat';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isOrganizationContext 
              ? 'Manage your organization\'s subscription and billing'
              : 'Start free and scale as you grow. No hidden fees, no surprises.'
            }
          </p>
          {isOrganizationContext && organization && (
            <p className="text-sm text-gray-500 mt-2">
              Managing pricing for: <strong>{organization.name}</strong>
            </p>
          )}
        </div>

        {/* Clerk's native PricingTable - shows organization or individual plans based on context */}
        <div className="max-w-5xl mx-auto">
          <PricingTable forOrganizations={isOrganizationContext} />
        </div>

        {/* Additional team seats for organizations */}
        {hasOrgPlan && (
          <div className="mt-12 max-w-3xl mx-auto">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Need More Team Seats?
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Add additional team members to your organization
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-semibold">$30/month</span> per additional seat
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowTeamSeats(true)}
                  >
                    Add Team Member
                  </Button>
                </div>

                {showTeamSeats && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                      Each additional seat includes full access for one team member.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handleAddTeamSeat}
                      >
                        Purchase Additional Seat ($30/mo)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowTeamSeats(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Pricing details - these come from Clerk but we can highlight key points */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            All Plans Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Recommendations</h3>
              <p className="text-sm text-gray-600">
                Get instant carrier matches with evidence-based citations
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure & Compliant</h3>
              <p className="text-sm text-gray-600">
                HIPAA compliant with enterprise-grade security
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Dedicated Support</h3>
              <p className="text-sm text-gray-600">
                Get help when you need it with priority support tiers
              </p>
            </div>
          </div>
        </div>

        {/* FAQ or comparison section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto text-left space-y-6">
            <Card>
              <details className="p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  What's included in the Individual plan ($50/month)?
                </summary>
                <p className="mt-3 text-gray-600">
                  The Individual plan includes 100 recommendations per month, full carrier database access,
                  priority processing, advanced analytics, and email support.
                </p>
              </details>
            </Card>

            <Card>
              <details className="p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  What's included in the Enterprise plan ($150/month)?
                </summary>
                <p className="mt-3 text-gray-600">
                  Enterprise includes unlimited recommendations, 5 team seats, API access,
                  white-label options, dedicated support, custom integrations, and SLA guarantees.
                  Additional seats are $30/month each.
                </p>
              </details>
            </Card>

            <Card>
              <details className="p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Can I change plans anytime?
                </summary>
                <p className="mt-3 text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                  immediately for upgrades, and at the next billing cycle for downgrades.
                </p>
              </details>
            </Card>

            <Card>
              <details className="p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Do you offer a free trial?
                </summary>
                <p className="mt-3 text-gray-600">
                  Yes, all paid plans include a 14-day free trial. No credit card required to start.
                  You can also use our free tier indefinitely with 5 recommendations per month.
                </p>
              </details>
            </Card>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Need a custom plan or have questions?{' '}
            <a href="mailto:sales@carrierllm.com" className="text-blue-600 hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};