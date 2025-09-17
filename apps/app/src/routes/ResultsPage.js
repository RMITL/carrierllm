import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import { Banner, Button } from '@carrierllm/ui';
import { RecommendationList } from '../features/recommendations/RecommendationList';
import { fetchRecommendations, fetchOrionRecommendation } from '../lib/api';
export const ResultsPage = () => {
    const params = useParams();
    const location = useLocation();
    const seeded = location.state;
    const resultId = params.id ?? seeded?.submissionId ?? seeded?.recommendationId;
    // Determine if this is an Orion recommendation based on the seeded data structure
    const isOrionRecommendation = seeded && 'recommendationId' in seeded;
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['recommendations', resultId, isOrionRecommendation],
        queryFn: async () => {
            if (isOrionRecommendation) {
                return await fetchOrionRecommendation(resultId);
            }
            else {
                return await fetchRecommendations(resultId);
            }
        },
        enabled: Boolean(resultId && !seeded)
    });
    const recommendationData = seeded ?? data;
    if (!resultId) {
        return (_jsx(Banner, { variant: "error", title: "Missing submission", description: "Return to intake to create a new client profile." }));
    }
    if (isLoading) {
        return _jsx("p", { className: "text-sm text-[color:var(--color-gray-500)]", children: "Loading recommendations..." });
    }
    if (!recommendationData || isError) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Banner, { variant: "error", title: "Unable to load recommendations", description: "Please retry. If the issue persists, confirm the Workers API is running." }), _jsx(Button, { onClick: () => refetch(), children: "Retry" })] }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("header", { className: "flex flex-col gap-2", children: [_jsx("h1", { className: "text-2xl font-semibold text-[color:var(--color-gray-900)]", children: "Carrier Recommendations" }), _jsx("p", { className: "text-sm text-[color:var(--color-gray-500)]", children: (isOrionRecommendation || (recommendationData && 'recommendationId' in recommendationData))
                            ? `Recommendation #${recommendationData?.recommendationId}`
                            : `Submission #${recommendationData?.submissionId}` })] }), _jsx(RecommendationList, { data: recommendationData, isOrionFormat: isOrionRecommendation || (recommendationData && 'recommendationId' in recommendationData) || false })] }));
};
