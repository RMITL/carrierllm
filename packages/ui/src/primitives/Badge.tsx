import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[color:var(--color-green)] text-black',
  warning: 'bg-[color:var(--color-amber)] text-black',
  danger: 'bg-[color:var(--color-red)] text-white'
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ className, variant = 'success', ...props }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
      variantStyles[variant],
      className
    )}
    {...props}
  />
);
