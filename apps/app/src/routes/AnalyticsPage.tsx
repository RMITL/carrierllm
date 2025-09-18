import { useQuery } from '@tanstack/react-query';
import { Banner, Card, Badge, UsageMeter } from '@carrierllm/ui';
import { fetchAnalytics } from '../lib/api';
// import { PlanGate, FeatureGate } from '../components/auth/FeatureGates';
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

      {/* Key Metrics - Available to all */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <span className="text-blue-600 font-bold text-sm">
                  📊
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Intakes</p>
              <p className="text-lg font-bold text-gray-900">{data.stats.totalIntakes}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <span className="text-green-600 font-bold text-sm">
                  🎯
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Fit Score</p>
              <p className="text-lg font-bold text-gray-900">{data.stats.averageFitScore}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <span className="text-purple-600 font-bold text-sm">
                  ✅
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Placement Rate</p>
              <p className="text-lg font-bold text-gray-900">{data.stats.placementRate}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 font-bold text-sm">
                  🔄
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Remaining</p>
              <p className="text-lg font-bold text-gray-900">{data.stats.remainingRecommendations}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Analytics - Individual plan and up */}
      {/* <PlanGate plan="individual"> */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Carriers */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Carriers</h3>
            {topCarriers.length > 0 ? (
              <div className="space-y-3">
                {topCarriers.map((carrier, index) => (
                  <div key={carrier.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {carrier.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={carrier.successRate > 70 ? 'success' : 'secondary'}>
                        {carrier.successRate}% success
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {carrier.count} placements
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No carrier data available yet.</p>
            )}
          </Card>

          {/* Monthly Trends */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
            {monthlyTrends.length > 0 ? (
              <div className="space-y-3">
                {monthlyTrends.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      {new Date(trend.month).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {trend.intakes} intakes
                        </p>
                        <p className="text-xs text-gray-500">
                          {trend.conversions} conversions
                        </p>
                      </div>
                      <UsageMeter
                        value={trend.conversionRate}
                        label=""
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No trend data available yet.</p>
            )}
          </Card>
        </div>
      {/* </PlanGate> */}

      {/* Export Features - Individual plan and up */}
      {/* <FeatureGate feature="export_analytics"> */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download your analytics data in CSV or PDF format
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Export CSV
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Export PDF
              </button>
            </div>
          </div>
        </Card>
      {/* </FeatureGate> */}

      {/* Team Analytics - Enterprise only */}
      {/* <PlanGate plan="enterprise"> */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
          <div className="text-sm text-gray-600">
            <p>Team-wide analytics and individual agent performance metrics will appear here.</p>
            <p className="mt-2">This feature is available for Enterprise plans.</p>
          </div>
        </Card>
      {/* </PlanGate> */}
    </div>
  );
};