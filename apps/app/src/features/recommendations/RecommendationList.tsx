import React, { memo, useCallback, useMemo } from 'react';
import { CarrierCard, UsageMeter, Card, Badge, Button } from '@carrierllm/ui';
import { logOutcome } from '../../lib/api';
import type {
  CarrierRecommendation,
  RecommendationSummary,
  RecommendationResponse,
  OrionRecommendationResponse,
  IulGuidance
} from '../../types';

export interface RecommendationListProps {
  data: RecommendationResponse | OrionRecommendationResponse;
  isOrionFormat: boolean;
}

export const RecommendationList = memo(({ data, isOrionFormat }: RecommendationListProps) => {
  // Memoized data extraction
  const extractedData = useMemo(() => {
    if (!data) {
      return {
        recommendations: [],
        summary: { averageFit: 0, totalCarriersEvaluated: 0, notes: '' },
        stretch: undefined,
        premiumSuggestion: undefined,
        recommendationId: '',
      };
    }

    const orionData = data as OrionRecommendationResponse;
    const legacyData = data as RecommendationResponse;

    return {
      recommendations: isOrionFormat ? (orionData.recommendations || []) : (legacyData.recommendations || []),
      summary: isOrionFormat ? (orionData.summary || { averageFit: 0, totalCarriersEvaluated: 0, notes: '' }) : (legacyData.summary || { averageFit: 0, totalCarriersEvaluated: 0, notes: '' }),
      stretch: isOrionFormat ? orionData.stretch : undefined,
      premiumSuggestion: isOrionFormat ? orionData.premiumSuggestion : undefined,
      recommendationId: isOrionFormat ? (orionData.recommendationId || '') : (legacyData.submissionId || ''),
    };
  }, [data, isOrionFormat]);

  const { recommendations, summary, stretch, premiumSuggestion, recommendationId } = extractedData;

  // Memoized handlers
  const handleOutcome = useCallback(async (carrierId: string, outcome: 'placed' | 'declined') => {
    try {
      await logOutcome(recommendationId, carrierId, outcome);
      alert(`Outcome logged: ${outcome} for ${carrierId}`);
    } catch (error) {
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
    if (summary.averageFit >= 70) return 'success';
    if (summary.averageFit >= 50) return 'warning';
    return 'danger';
  }, [summary.averageFit]);

  const badgeText = useMemo(() => {
    if (summary.averageFit >= 70) return 'Strong Match';
    if (summary.averageFit >= 50) return 'Moderate Match';
    return 'Challenging Case';
  }, [summary.averageFit]);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Card */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendation Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">Average Fit</p>
            <div className="flex items-center gap-2">
              <UsageMeter value={summary.averageFit} label="Overall alignment" />
              <span className="text-lg font-semibold text-gray-900">{summary.averageFit}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Top Carrier</p>
            <p className="text-base font-medium text-gray-900">
              {recommendations[0]?.carrierName || summary.topCarrierId || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge variant={badgeVariant}>
              {badgeText}
            </Badge>
          </div>
        </div>
        {summary.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">{summary.notes}</p>
          </div>
        )}
      </Card>

      {/* Premium Suggestion (Orion only) */}
      {premiumSuggestion && premiumSuggestion.monthly && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Guidance</h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Suggested Monthly Premium</p>
              <p className="text-xl font-bold text-green-600">${premiumSuggestion.monthly.toLocaleString()}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{premiumSuggestion.note}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Top Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Carrier Recommendations</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations && recommendations.length > 0 ? recommendations.map((rec) => (
            <CarrierCard
              key={rec.carrierId}
              carrierName={rec.carrierName}
              program={isOrionFormat ? rec.product : rec.program || rec.product || 'Standard Program'}
              fitPct={rec.fitScore || rec.fitPct || rec.fitPercent || 0}
              confidence={rec.confidence}
              reasons={rec.reasoning?.pros || rec.reasons || []}
              advisories={rec.reasoning?.cons || rec.advisories || []}
              apsLikely={rec.apsLikely || false}
              citations={rec.citations || []}
              ctas={rec.ctas}
              onApply={() => {
                if (rec.ctas?.portalUrl) {
                  window.open(rec.ctas.portalUrl, '_blank', 'noopener,noreferrer');
                } else {
                  handleOutcome(rec.carrierId, 'placed');
                }
              }}
            />
          )) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-gray-500">No recommendations available</p>
            </div>
          )}
        </div>
      </div>

      {/* Stretch Option (Orion only) */}
      {stretch && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stretch Option</h3>
          <div className="max-w-lg">
            <CarrierCard
              carrierName={stretch.carrierName}
              program={stretch.product}
              fitPct={stretch.fitScore || stretch.fitPct || 0}
              confidence={stretch.confidence}
              reasons={stretch.reasoning?.pros || stretch.reasons || []}
              advisories={stretch.reasoning?.cons || stretch.advisories || []}
              apsLikely={stretch.apsLikely}
              citations={stretch.citations}
              ctas={stretch.ctas}
              onApply={() => {
                if (stretch.ctas?.portalUrl) {
                  window.open(stretch.ctas.portalUrl, '_blank', 'noopener,noreferrer');
                } else {
                  handleOutcome(stretch.carrierId, 'placed');
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This carrier may accept higher-risk profiles but typically requires additional underwriting.
          </p>
        </div>
      )}

      {/* Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePrint}
            variant="secondary"
          >
            Print Results
          </Button>
          <Button
            onClick={handleShare}
            variant="secondary"
          >
            Share Results
          </Button>
          <Button
            onClick={handleNewIntake}
          >
            New Intake
          </Button>
        </div>
      </Card>
    </div>
  );
});

RecommendationList.displayName = 'RecommendationList';
