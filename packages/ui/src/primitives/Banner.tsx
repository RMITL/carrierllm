import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

type BannerVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<BannerVariant, string> = {
  info: 'bg-[color:var(--color-gray-100)] text-[color:var(--color-gray-900)]',
  success: 'bg-[color:var(--color-green)] text-black',
  warning: 'bg-[color:var(--color-amber)] text-black',
  error: 'bg-[color:var(--color-red)] text-white'
};

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
  title?: ReactNode;
  description?: ReactNode;
}

export const Banner = ({
  className,
  variant = 'info',
  title,
  description,
  role = 'status',
  ...props
}: BannerProps) => (
  <div
    role={role}
    className={clsx(
      'flex items-start gap-3 rounded-[var(--border-radius-base)] px-4 py-3 shadow-sm',
      variantStyles[variant],
      className
    )}
    {...props}
  >
    <div className="flex flex-col gap-1">
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {description ? <p className="text-sm leading-5">{description}</p> : null}
    </div>
  </div>
);
