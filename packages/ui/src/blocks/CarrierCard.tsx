import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Card } from '../primitives/Card';
import { EvidencePopover, type CarrierCitation } from './EvidencePopover';

export interface CarrierCardProps {
  carrierName: string;
  program: string;
  fitPct: number;
  confidence?: 'low' | 'medium' | 'high';
  reasons: string[];
  advisories?: string[];
  apsLikely?: boolean;
  citations?: CarrierCitation[];
  ctas?: {
    portalUrl: string;
    agentPhone: string;
  };
  onViewSource?: () => void;
  onApply?: () => void;
}

const getBadgeVariant = (fit: number) => {
  if (fit >= 80) return 'success';
  if (fit >= 60) return 'warning';
  return 'danger';
};

const getConfidenceBadge = (confidence?: string) => {
  switch (confidence) {
    case 'high': return <Badge variant="success">High Confidence</Badge>;
    case 'medium': return <Badge variant="warning">Medium Confidence</Badge>;
    case 'low': return <Badge variant="danger">Low Confidence</Badge>;
    default: return null;
  }
};

export const CarrierCard = ({
  carrierName,
  program,
  fitPct,
  confidence,
  reasons,
  advisories = [],
  apsLikely = false,
  citations = [],
  ctas,
  onViewSource,
  onApply
}: CarrierCardProps) => {
  const handleApply = () => {
    if (ctas?.portalUrl) {
      window.open(ctas.portalUrl, '_blank', 'noopener,noreferrer');
    } else if (onApply) {
      onApply();
    }
  };

  const handleViewSource = () => {
    if (onViewSource) {
      onViewSource();
    }
  };

  return (
    <Card
      title={carrierName}
      description={`Program: ${program}`}
      footer={
        <div className="flex flex-wrap gap-2">
          {citations.length > 0 ? (
            <EvidencePopover citations={citations} />
          ) : (
            <Button variant="secondary" onClick={handleViewSource} aria-label={`View underwriting sources for ${carrierName}`}>
              View Source
            </Button>
          )}
          <Button onClick={handleApply} aria-label={`Apply to ${carrierName}`}>
            Apply
          </Button>
          {ctas?.agentPhone && (
            <Button
              variant="secondary"
              onClick={() => window.open(`tel:${ctas.agentPhone}`, '_self')}
              aria-label={`Call ${carrierName} at ${ctas.agentPhone}`}
            >
              Call
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant={getBadgeVariant(fitPct)}>{fitPct}% Fit</Badge>
          {confidence && getConfidenceBadge(confidence)}
          {apsLikely && <Badge variant="warning">APS Likely</Badge>}
        </div>

        <div>
          <p className="text-sm font-medium text-[color:var(--color-gray-900)] mb-2">Top reasons</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-gray-700)]">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>

        {advisories.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[color:var(--color-amber-700)] mb-2">Advisories</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-amber-700)]">
              {advisories.map((advisory, index) => (
                <li key={index}>{advisory}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};
