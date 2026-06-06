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
  blue:   'before:bg-brand-blue',
  orange: 'before:bg-brand-orange',
  sky:    'before:bg-brand-sky',
  green:  'before:bg-brand-green',
  logo:   'before:bg-[var(--gradient-logo)]',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-7',
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
        'relative overflow-hidden bg-card rounded-3xl border border-border shadow-[0_18px_44px_rgba(4,43,92,0.06)]',
        'before:absolute before:left-0 before:top-0 before:h-1 before:w-full',
        accentStyles[accent],
        hoverable &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(4,43,92,0.10)] hover:border-brand-orange/40',
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
      className={cn('text-base font-semibold leading-snug text-foreground', className)}
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
