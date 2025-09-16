import { useQuery } from '@tanstack/react-query';
import { Banner } from '@carrierllm/ui';
import { fetchAnalytics } from '../lib/api';

export const AnalyticsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: fetchAnalytics
  });

  if (isLoading) {
    return <p className="text-sm text-[color:var(--color-gray-500)]">Loading analytics...</p>;
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--color-gray-900)]">
          Placement analytics
        </h1>
        <p className="text-sm text-[color:var(--color-gray-500)]">
          Last synced {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-4 shadow-card">
          <p className="text-sm text-[color:var(--color-gray-500)]">Total submissions</p>
          <p className="text-2xl font-bold text-[color:var(--color-gray-900)]">{data.totalSubmissions}</p>
        </div>
        <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-4 shadow-card">
          <p className="text-sm text-[color:var(--color-gray-500)]">Avg fit score</p>
          <p className="text-2xl font-bold text-[color:var(--color-gray-900)]">{data.averageFit}%</p>
        </div>
        <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-4 shadow-card">
          <p className="text-sm text-[color:var(--color-gray-500)]">Placement rate</p>
          <p className="text-2xl font-bold text-[color:var(--color-gray-900)]">{data.placementRate}%</p>
        </div>
      </div>
    </div>
  );
};
