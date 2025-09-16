import { CarrierCard, UsageMeter } from '@carrierllm/ui';
import type { CarrierRecommendation, RecommendationSummary } from '../../types';

export interface RecommendationListProps {
  recommendations: CarrierRecommendation[];
  summary: RecommendationSummary;
}

export const RecommendationList = ({ recommendations, summary }: RecommendationListProps) => (
  <div className="flex flex-col gap-6">
    <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-6 shadow-card">
      <h2 className="text-xl font-semibold text-[color:var(--color-gray-900)]">Snapshot</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-[color:var(--color-gray-500)]">Average fit</p>
          <UsageMeter value={summary.averageFit} label="Overall alignment" />
        </div>
        <div>
          <p className="text-sm text-[color:var(--color-gray-500)]">Next action</p>
          <p className="text-base font-medium text-[color:var(--color-gray-900)]">
            Submit to {summary.topCarrierId}
          </p>
          <p className="text-sm text-[color:var(--color-gray-500)]">{summary.notes}</p>
        </div>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {recommendations.map((rec) => (
        <CarrierCard
          key={rec.carrierId}
          carrierName={rec.carrierName}
          program={rec.program}
          fitPct={rec.fitPercent}
          reasons={rec.reasons}
          onViewSource={() => rec.citations[0] && window.open(rec.citations[0].url, '_blank')}
          onApply={() => {
            // This would eventually trigger CRM or carrier workflow integration.
            alert(`Application workflow for ${rec.carrierName} coming soon.`);
          }}
        />
      ))}
    </div>
  </div>
);
