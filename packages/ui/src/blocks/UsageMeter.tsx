import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export interface UsageMeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
}

export const UsageMeter = ({
  value,
  max = 100,
  label = 'Usage',
  className,
  ...props
}: UsageMeterProps) => {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const variant = percent >= 90 ? 'bg-[color:var(--color-red)]' : percent >= 75 ? 'bg-[color:var(--color-amber)] text-black' : 'bg-[color:var(--color-primary)]';

  return (
    <div className={clsx('flex w-full flex-col gap-2', className)} {...props}>
      <div className="flex items-center justify-between text-sm text-[color:var(--color-gray-500)]">
        <span>{label}</span>
        <span aria-live="polite" className="font-semibold text-[color:var(--color-gray-900)]">
          {percent}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-gray-100)]"
        role="progressbar"
        aria-valuenow={Math.min(value, max)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx('h-2 transition-all duration-300 ease-out', variant)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
