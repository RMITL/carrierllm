import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import { Banner, Button } from '@carrierllm/ui';
import { RecommendationList } from '../features/recommendations/RecommendationList';
import { fetchRecommendations } from '../lib/api';
import type { RecommendationResponse } from '../types';

export const ResultsPage = () => {
  const params = useParams();
  const location = useLocation();
  const seeded = location.state as RecommendationResponse | undefined;
  const submissionId = params.id ?? seeded?.submissionId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations', submissionId],
    queryFn: () => fetchRecommendations(submissionId!),
    enabled: Boolean(submissionId && !seeded)
  });

  const recommendationData = seeded ?? data;

  if (!submissionId) {
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
          Carrier recommendations
        </h1>
        <p className="text-sm text-[color:var(--color-gray-500)]">
          Submission #{recommendationData.submissionId}
        </p>
      </header>
      <RecommendationList
        recommendations={recommendationData.recommendations}
        summary={recommendationData.summary}
      />
    </div>
  );
};
