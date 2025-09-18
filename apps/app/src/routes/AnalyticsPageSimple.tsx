import { useEffect, useState } from 'react';
import { Card, Banner } from '@carrierllm/ui';

export const AnalyticsPageSimple = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8787/api/analytics/summary', {
      headers: {
        'X-User-Id': 'test-user'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Analytics data received:', data);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Analytics fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Loading Analytics...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Banner
          variant="error"
          title="Analytics Error"
          description={`Failed to load analytics: ${error}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Simple analytics display for debugging
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Total Intakes</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.totalIntakes || 0}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Avg Fit Score</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.averageFitScore || 0}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Placement Rate</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.placementRate || 0}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.remainingRecommendations || 0}</p>
        </Card>
      </div>

      {/* Top Carriers */}
      {data?.topCarriers && data.topCarriers.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Carriers</h3>
          <div className="space-y-2">
            {(data.topCarriers || []).map((carrier: any, index: number) => (
              <div key={carrier.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{carrier.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{carrier.successRate}% success</span>
                  <span className="text-xs text-gray-500">({carrier.count} placements)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Debug Info */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Info</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    </div>
  );
};