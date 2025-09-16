import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Card } from '../primitives/Card';

export interface CarrierCardProps {
  carrierName: string;
  program: string;
  fitPct: number;
  reasons: string[];
  onViewSource?: () => void;
  onApply?: () => void;
}

const getBadgeVariant = (fit: number) => {
  if (fit >= 80) return 'success';
  if (fit >= 60) return 'warning';
  return 'danger';
};

export const CarrierCard = ({
  carrierName,
  program,
  fitPct,
  reasons,
  onViewSource,
  onApply
}: CarrierCardProps) => (
  <Card
    title={carrierName}
    description={`Program: ${program}`}
    footer={
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onViewSource} aria-label={`View underwriting sources for ${carrierName}`}>
          View Source
        </Button>
        <Button onClick={onApply} aria-label={`Apply to ${carrierName}`}>
          Apply
        </Button>
      </div>
    }
  >
    <div className="flex items-center justify-between">
      <Badge variant={getBadgeVariant(fitPct)}>{fitPct}% Fit</Badge>
      <p className="text-sm text-[color:var(--color-gray-500)]">Top reasons</p>
    </div>
    <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-gray-900)]">
      {reasons.map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
  </Card>
);
