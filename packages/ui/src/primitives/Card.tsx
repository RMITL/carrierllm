import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export const Card = ({
  className,
  title,
  description,
  footer,
  children,
  ...props
}: CardProps) => (
  <div
    className={clsx(
      'flex flex-col gap-4 rounded-[var(--border-radius-base)] bg-white p-6 shadow-[var(--shadow-card)]',
      className
    )}
    {...props}
  >
    {title ? <h3 className="text-lg font-semibold text-[color:var(--color-gray-900)]">{title}</h3> : null}
    {description ? <p className="text-sm text-[color:var(--color-gray-500)]">{description}</p> : null}
    {children}
    {footer ? <div className="mt-2 border-t border-[color:var(--color-gray-100)] pt-4">{footer}</div> : null}
  </div>
);
