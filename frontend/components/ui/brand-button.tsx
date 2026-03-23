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
  primary:   'bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)] shadow-sm',
  secondary: 'bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-dark)] shadow-sm',
  outline:   'border border-[var(--brand-blue)] text-[var(--brand-blue)] bg-transparent hover:bg-[var(--brand-blue-subtle)]',
  ghost:     'text-[var(--brand-blue)] bg-transparent hover:bg-[var(--brand-blue-subtle)]',
  danger:    'bg-red-600 text-white hover:bg-red-700',
};

const sizeStyles: Record<BrandSize, string> = {
  sm:  'h-8  px-3 text-xs  rounded-md gap-1.5',
  md:  'h-10 px-4 text-sm  rounded-lg gap-2',
  lg:  'h-11 px-6 text-base rounded-lg gap-2',
  xl:  'h-13 px-8 text-lg  rounded-xl gap-2.5',
};

export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2',
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
