import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useMemo } from 'react';
import { CarrierCard, UsageMeter, Card, Badge, Button } from '@carrierllm/ui';
import { logOutcome } from '../../lib/api';
export const RecommendationList = memo(({ data, isOrionFormat }) => {
    // Memoized data extraction
    const extractedData = useMemo(() => {
        const orionData = data;
        const legacyData = data;
        return {
            recommendations: isOrionFormat ? orionData.top : legacyData.recommendations,
            summary: isOrionFormat ? orionData.summary : legacyData.summary,
            stretch: isOrionFormat ? orionData.stretch : undefined,
            premiumSuggestion: isOrionFormat ? orionData.premiumSuggestion : undefined,
            recommendationId: isOrionFormat ? orionData.recommendationId : legacyData.submissionId,
        };
    }, [data, isOrionFormat]);
    const { recommendations, summary, stretch, premiumSuggestion, recommendationId } = extractedData;
    // Memoized handlers
    const handleOutcome = useCallback(async (carrierId, outcome) => {
        try {
            await logOutcome(recommendationId, carrierId, outcome);
            alert(`Outcome logged: ${outcome} for ${carrierId}`);
        }
        catch (error) {
            console.error('Failed to log outcome:', error);
            alert('Failed to log outcome');
        }
    }, [recommendationId]);
    const handlePrint = useCallback(() => {
        window.print();
    }, []);
    const handleShare = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }, []);
    const handleNewIntake = useCallback(() => {
        window.location.href = '/intake';
    }, []);
    // Memoized badge variant calculation
    const badgeVariant = useMemo(() => {
        if (summary.averageFit >= 70)
            return 'success';
        if (summary.averageFit >= 50)
            return 'warning';
        return 'danger';
    }, [summary.averageFit]);
    const badgeText = useMemo(() => {
        if (summary.averageFit >= 70)
            return 'Strong Match';
        if (summary.averageFit >= 50)
            return 'Moderate Match';
        return 'Challenging Case';
    }, [summary.averageFit]);
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs(Card, { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recommendation Summary" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Average Fit" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(UsageMeter, { value: summary.averageFit, label: "Overall alignment" }), _jsxs("span", { className: "text-lg font-semibold text-gray-900", children: [summary.averageFit, "%"] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Top Carrier" }), _jsx("p", { className: "text-base font-medium text-gray-900", children: recommendations[0]?.carrierName || summary.topCarrierId })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Status" }), _jsx(Badge, { variant: badgeVariant, children: badgeText })] })] }), summary.notes && (_jsx("div", { className: "mt-4 p-3 bg-blue-50 rounded-md", children: _jsx("p", { className: "text-sm text-blue-800", children: summary.notes }) }))] }), premiumSuggestion && (_jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Premium Guidance" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Suggested Monthly Premium" }), _jsxs("p", { className: "text-xl font-bold text-green-600", children: ["$", premiumSuggestion.monthly.toLocaleString()] })] }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-sm text-gray-600", children: premiumSuggestion.note }) })] })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Top Carrier Recommendations" }), _jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: recommendations.map((rec) => (_jsx(CarrierCard, { carrierName: rec.carrierName, program: isOrionFormat ? rec.product : rec.program || rec.product || 'Standard Program', fitPct: isOrionFormat ? rec.fitPct : rec.fitPercent || rec.fitPct, confidence: rec.confidence, reasons: rec.reasons, advisories: rec.advisories, apsLikely: rec.apsLikely, citations: rec.citations, ctas: rec.ctas, onApply: () => {
                                if (rec.ctas?.portalUrl) {
                                    window.open(rec.ctas.portalUrl, '_blank', 'noopener,noreferrer');
                                }
                                else {
                                    handleOutcome(rec.carrierId, 'placed');
                                }
                            } }, rec.carrierId))) })] }), stretch && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Stretch Option" }), _jsx("div", { className: "max-w-lg", children: _jsx(CarrierCard, { carrierName: stretch.carrierName, program: stretch.product, fitPct: stretch.fitPct, confidence: stretch.confidence, reasons: stretch.reasons, advisories: stretch.advisories, apsLikely: stretch.apsLikely, citations: stretch.citations, ctas: stretch.ctas, onApply: () => {
                                if (stretch.ctas?.portalUrl) {
                                    window.open(stretch.ctas.portalUrl, '_blank', 'noopener,noreferrer');
                                }
                                else {
                                    handleOutcome(stretch.carrierId, 'placed');
                                }
                            } }) }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: "This carrier may accept higher-risk profiles but typically requires additional underwriting." })] })), _jsxs(Card, { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Next Steps" }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Button, { onClick: handlePrint, variant: "secondary", children: "Print Results" }), _jsx(Button, { onClick: handleShare, variant: "secondary", children: "Share Results" }), _jsx(Button, { onClick: handleNewIntake, children: "New Intake" })] })] })] }));
});
RecommendationList.displayName = 'RecommendationList';
