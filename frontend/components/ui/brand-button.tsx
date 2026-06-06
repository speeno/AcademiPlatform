import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type BrandVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type BrandSize = 'sm' | 'md' | 'lg' | 'xl';

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrandVariant;
  size?: BrandSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<BrandVariant, string> = {
  primary:
    'bg-logo-gradient text-white shadow-[0_12px_28px_rgba(7,59,120,0.18)] hover:translate-y-[-1px] hover:shadow-[0_18px_34px_rgba(7,59,120,0.24)]',
  secondary:
    'bg-brand-blue text-white shadow-[0_10px_20px_rgba(4,43,92,0.12)] hover:bg-brand-blue-dark hover:translate-y-[-1px]',
  outline:
    'border border-border bg-white text-brand-blue hover:border-brand-orange/50 hover:bg-brand-orange-subtle',
  ghost:     'text-brand-blue bg-transparent hover:bg-brand-blue-subtle',
  danger:    'bg-destructive text-white hover:opacity-90',
};

const sizeStyles: Record<BrandSize, string> = {
  sm:  'h-10 px-4 text-xs rounded-full gap-1.5',
  md:  'h-11 px-5 text-sm rounded-full gap-2',
  lg:  'h-12 px-7 text-base rounded-full gap-2',
  xl:  'h-14 px-9 text-lg rounded-full gap-2.5',
};

export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold tracking-[-0.01em] transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

BrandButton.displayName = 'BrandButton';
