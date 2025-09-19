import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card, Button, Badge } from '@carrierllm/ui';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics, getUserHistory, getUserUsage } from '../lib/api';
import type { AnalyticsSummary } from '../types';

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'intake' | 'recommendation';
  title: string;
  score?: number;
  intakeData?: any;
}


const quickActions = [
  {
    title: 'New Intake Form',
    description: 'Start a new client intake with our comprehensive questionnaire',
    href: '/intake',
    icon: 'form',
    variant: 'primary' as const,
  },
  {
    title: 'View History',
    description: 'Review your previous intakes and recommendations',
    href: '/history',
    icon: 'history',
    variant: 'secondary' as const,
  },
  {
    title: 'View Analytics',
    description: 'Review your placement performance and trends',
    href: '/analytics',
    icon: 'chart',
    variant: 'secondary' as const,
  },
];

const iconMap = {
  form: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  history: (                                           
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export const DashboardPage = () => {
  const { user, isLoaded: userLoaded } = useUser();

  // Fetch dashboard statistics with better error handling
  const { data: analytics, isLoading: statsLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchAnalytics,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    enabled: userLoaded && !!user, // Only fetch when user is loaded
    // Provide fallback data to prevent white screen
    placeholderData: {
      stats: {
        totalIntakes: 0,
        averageFitScore: 0,
        placementRate: 0,
        remainingRecommendations: 5
      }
    } as AnalyticsSummary
  });

  // Fetch user usage data
  const { data: usageData } = useQuery({
    queryKey: ['user-usage', user?.id],
    queryFn: getUserUsage,
    enabled: userLoaded && !!user,
    staleTime: 30000
  });

  // Fetch recent history for recommendations
  const { data: recentHistory } = useQuery({
    queryKey: ['user-history', user?.id],
    queryFn: getUserHistory,
    enabled: userLoaded && !!user,
    staleTime: 30000
  });

  // Add debugging logs
  console.log('DashboardPage render:', {
    userLoaded,
    user: user?.id,
    statsLoading,
    error: error?.message,
    analytics: !!analytics
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Show loading state while user is loading
  if (!userLoaded) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error && !analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName || 'Agent'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Ready to help your clients find the perfect insurance coverage?
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Unable to load dashboard data
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>There was an issue loading your dashboard statistics. You can still use the application features below.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.firstName || 'Agent'}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Ready to help your clients find the perfect insurance coverage?
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    {iconMap[action.icon as keyof typeof iconMap]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {action.description}
                  </p>
                  <Link to={action.href}>
                    <Button variant={action.variant} size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Summary */}
      {usageData && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Usage</h2>
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {usageData.plan} Plan
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {usageData.recommendationsUsed} of {usageData.recommendationsLimit === -1 ? '∞' : usageData.recommendationsLimit} recommendations used this month
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {usageData.status}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {usageData.recommendationsLimit === -1 ? '∞' : usageData.recommendationsLimit - usageData.recommendationsUsed}
                </div>
                <p className="text-xs text-gray-500">remaining</p>
              </div>
            </div>
            {usageData.recommendationsLimit > 0 && (
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (usageData.recommendationsUsed / usageData.recommendationsLimit) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Performance</h2>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : error ? '0' : analytics?.stats?.totalIntakes || '0'}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Average Fit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : error ? '0%' : `${Math.round(analytics?.stats?.averageFitScore || 0)}%`}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : error ? '0%' : `${Math.round(analytics?.stats?.placementRate || 0)}%`}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : error ? '∞' : analytics?.stats?.remainingRecommendations || '∞'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>


      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        {recentHistory && recentHistory.length > 0 ? (
          <Card>
            <div className="p-6">
              <div className="space-y-4">
                {recentHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {item.type === 'recommendation' ? (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.type === 'recommendation' && item.score && (
                        <Badge variant={item.score >= 80 ? 'success' : item.score >= 60 ? 'warning' : 'secondary'}>
                          {item.score}% fit
                        </Badge>
                      )}
                      {item.type === 'recommendation' ? (
                        <Link to={`/results/${item.id}`}>
                          <Button size="sm" variant="secondary">
                            View Results
                          </Button>
                        </Link>
                      ) : (
                        <Badge variant="secondary">Intake</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {recentHistory.length > 3 && (
                <div className="mt-4 text-center">
                  <Link to="/history">
                    <Button variant="secondary" size="sm">
                      View All Activity
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating your first intake submission.
              </p>
              <div className="mt-6">
                <Link to="/intake">
                  <Button>
                    Start New Intake
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};