import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-700)] focus-visible:outline-[color:var(--color-primary)]',
  secondary:
    'bg-white text-[color:var(--color-primary)] border border-[color:var(--color-primary)] hover:bg-[color:var(--color-gray-100)] focus-visible:outline-[color:var(--color-primary)]',
  destructive:
    'bg-[color:var(--color-red)] text-white hover:bg-red-600 focus-visible:outline-[color:var(--color-red)]'
};

const sizeStyles: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-base',
  sm: 'px-3 py-1.5 text-sm'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-[var(--border-radius-base)] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
