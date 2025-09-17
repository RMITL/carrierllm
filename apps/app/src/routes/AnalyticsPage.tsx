import { useQuery } from '@tanstack/react-query';
import { Banner, Card, Badge, UsageMeter } from '@carrierllm/ui';
import { fetchAnalytics } from '../lib/api';
import type { AnalyticsSummary } from '../types';

export const AnalyticsPage = () => {
  const { data, isLoading, isError } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary'],
    queryFn: fetchAnalytics
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Banner
        variant="warning"
        title="Analytics unavailable"
        description="We could not retrieve placement metrics. Confirm the Workers analytics endpoint is configured."
      />
    );
  }

  const topCarriers = data.topCarriers || [];
  const monthlyTrends = data.trends || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your placement performance and identify trends to optimize your success rate.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{data.stats.totalIntakes}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Fit Score</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(data.stats.averageFitScore)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Placement Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(data.stats.placementRate)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Remaining Recommendations</p>
              <p className="text-2xl font-semibold text-gray-900">{data.stats.remainingRecommendations}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Carriers */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Carriers</h3>
          <div className="space-y-4">
            {topCarriers.map((carrier, index) => (
              <div key={carrier.carrierName} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{carrier.carrierName}</p>
                    <p className="text-xs text-gray-500">{carrier.recommendations} recommendations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{Math.round((carrier.placements / carrier.recommendations) * 100)}%</p>
                  <p className="text-xs text-gray-500">placement rate</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
          <div className="space-y-4">
            {monthlyTrends.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{month.month}</p>
                  <p className="text-xs text-gray-500">{month.recommendations} recommendations</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 max-w-20">
                    <UsageMeter
                      value={(month.placements / month.recommendations) * 100}
                      label="Placement rate"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{Math.round((month.placements / month.recommendations) * 100)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Subscription Status</h4>
            <p className="text-sm text-green-600">
              {data.user.subscriptionTier} plan ({data.user.subscriptionStatus})
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Usage</h4>
            <p className="text-sm text-blue-600">
              {data.user.recommendationsUsed} / {data.user.recommendationsLimit} recommendations used
            </p>
          </div>
          {topCarriers.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Top Carrier</h4>
              <p className="text-sm text-amber-600">
                {topCarriers[0].carrierName} shows the highest placement rate ({Math.round((topCarriers[0].placements / topCarriers[0].recommendations) * 100)}%)
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
