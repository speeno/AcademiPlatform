import { cn } from '@/lib/utils';

interface BrandProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'logo' | 'blue' | 'orange' | 'green';
  className?: string;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const variantFill: Record<string, string> = {
  logo:   'bg-logo-gradient',
  blue:   'bg-[var(--brand-blue)]',
  orange: 'bg-[var(--brand-orange)]',
  green:  'bg-[var(--brand-green)]',
};

export function BrandProgress({
  value,
  max = 100,
  label,
  showPercent = false,
  size = 'md',
  variant = 'logo',
  className,
}: BrandProgressProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-gray-600">{label}</span>}
          {showPercent && (
            <span className="text-xs font-semibold" style={{ color: 'var(--brand-blue)' }}>
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-gray-100 overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', variantFill[variant])}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
