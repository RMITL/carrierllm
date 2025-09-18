import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import { Banner, Button } from '@carrierllm/ui';
import { RecommendationList } from '../features/recommendations/RecommendationList';
import { fetchRecommendations, fetchOrionRecommendation } from '../lib/api';
import type { RecommendationResponse, OrionRecommendationResponse } from '../types';

export const ResultsPage = () => {
  const params = useParams();
  const location = useLocation();
  const seeded = location.state as (RecommendationResponse | OrionRecommendationResponse) | undefined;
  const resultId = params.id ?? (seeded as any)?.submissionId ?? (seeded as any)?.recommendationId;

  console.log('ResultsPage - params:', params);
  console.log('ResultsPage - location.state:', location.state);
  console.log('ResultsPage - seeded:', seeded);
  console.log('ResultsPage - resultId:', resultId);

  // Determine if this is an Orion recommendation based on the seeded data structure
  const isOrionRecommendation = seeded && 'recommendationId' in seeded;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations', resultId, isOrionRecommendation],
    queryFn: async () => {
      if (isOrionRecommendation) {
        return await fetchOrionRecommendation(resultId!);
      } else {
        return await fetchRecommendations(resultId!);
      }
    },
    enabled: Boolean(resultId && !seeded)
  });

  const recommendationData = seeded ?? data;

  if (!resultId) {
    return (
      <Banner
        variant="error"
        title="Missing submission"
        description="Return to intake to create a new client profile."
      />
    );
  }

  if (isLoading) {
    return <p className="text-sm text-[color:var(--color-gray-500)]">Loading recommendations...</p>;
  }

  if (!recommendationData || isError) {
    return (
      <div className="space-y-4">
        <Banner
          variant="error"
          title="Unable to load recommendations"
          description="Please retry. If the issue persists, confirm the Workers API is running."
        />
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--color-gray-900)]">
          Carrier Recommendations
        </h1>
        <p className="text-sm text-[color:var(--color-gray-500)]">
          {(isOrionRecommendation || (recommendationData && 'recommendationId' in recommendationData))
            ? `Recommendation #${(recommendationData as OrionRecommendationResponse)?.recommendationId}`
            : `Submission #${(recommendationData as RecommendationResponse)?.submissionId}`
          }
        </p>
      </header>
      <RecommendationList
        data={recommendationData!}
        isOrionFormat={isOrionRecommendation || (recommendationData && 'recommendationId' in recommendationData) || false}
      />
    </div>
  );
};
