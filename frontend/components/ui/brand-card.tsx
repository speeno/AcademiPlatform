import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type CardAccent = 'none' | 'blue' | 'orange' | 'sky' | 'green' | 'logo';

interface BrandCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const accentStyles: Record<CardAccent, string> = {
  none:   '',
  blue:   'border-t-2 border-t-[var(--brand-blue)]',
  orange: 'border-t-2 border-t-[var(--brand-orange)]',
  sky:    'border-t-2 border-t-[var(--brand-sky)]',
  green:  'border-t-2 border-t-[var(--brand-green)]',
  logo:   'border-t-2 border-t-transparent [border-image:var(--gradient-logo)_1]',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function BrandCard({
  accent = 'none',
  hoverable = false,
  padding = 'md',
  className,
  children,
  ...props
}: BrandCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border shadow-sm',
        accentStyles[accent],
        hoverable && 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--brand-sky)]',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BrandCardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function BrandCardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold leading-snug text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function BrandCardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}
