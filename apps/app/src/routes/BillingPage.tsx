import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Badge, UsageMeter } from '@carrierllm/ui';
import { getUserUsage } from '../lib/api';


const plans = [
  {
    name: 'Individual',
    price: 29,
    recommendations: 50,
    features: [
      'Up to 50 recommendations per month',
      'Basic carrier database access',
      'Email support',
      'Standard processing time'
    ]
  },
  {
    name: 'Team',
    price: 99,
    recommendations: 200,
    popular: true,
    features: [
      'Up to 200 recommendations per month',
      'Full carrier database access',
      'Priority support',
      'Faster processing',
      'Team collaboration tools',
      'Advanced analytics'
    ]
  },
  {
    name: 'Enterprise',
    price: 299,
    recommendations: 1000,
    features: [
      'Up to 1,000 recommendations per month',
      'Complete carrier database',
      'Dedicated support',
      'Fastest processing',
      'Custom integrations',
      'White-label options',
      'SLA guarantees'
    ]
  }
];

export const BillingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: usage, isLoading } = useQuery({
    queryKey: ['user-usage'],
    queryFn: getUserUsage
  });

  const usagePercentage = usage ? (usage.recommendationsUsed / usage.recommendationsLimit) * 100 : 0;

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName);
    // In a real app, this would integrate with Stripe
    alert(`Upgrade to ${planName} plan initiated. This would integrate with Stripe.`);
  };

  const handleDowngrade = () => {
    alert('Downgrade initiated. Changes will take effect at the next billing cycle.');
  };

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      alert('Subscription cancelled. Access will continue until the end of your billing period.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your subscription and monitor your usage.
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{usage?.plan} Plan</p>
                  <p className="text-sm text-gray-500">Subscription plan</p>
                </div>
                <Badge variant={usage?.status === 'active' ? 'success' : 'warning'}>
                  {usage?.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Subscription Status</p>
                <p className="font-medium text-gray-900">
                  {usage?.status || 'N/A'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Recommendations Used</span>
                  <span className="text-sm text-gray-500">
                    {usage?.recommendationsUsed} / {usage?.recommendationsLimit}
                  </span>
                </div>
                <UsageMeter
                  value={usagePercentage}
                  label="Monthly usage"
                />
                {usagePercentage > 80 && (
                  <p className="text-sm text-orange-600 mt-2">
                    You're approaching your monthly limit. Consider upgrading to avoid interruptions.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <path d="M4 8h16v2H4V8z" fill="white"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expires 12/25</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full">
                Update Payment Method
              </Button>
              <Button variant="secondary" size="sm" className="w-full">
                Download Invoice
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-2 border-[color:var(--color-primary)]' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="success">Most Popular</Badge>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.recommendations} recommendations included
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.name)}
                variant={usage?.plan === plan.name ? 'secondary' : 'primary'}
                className="w-full"
                disabled={usage?.plan === plan.name}
              >
                {usage?.plan === plan.name ? 'Current Plan' : 'Upgrade'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Dec 15, 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Team Plan - Monthly
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $99.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Nov 15, 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Team Plan - Monthly
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $99.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Downgrade Plan</p>
              <p className="text-sm text-gray-500">Switch to a lower-tier plan</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDowngrade}>
              Downgrade
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Cancel Subscription</p>
              <p className="text-sm text-gray-500">Permanently cancel your subscription</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCancelSubscription}>
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};