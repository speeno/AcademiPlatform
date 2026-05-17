import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'blue'
  | 'orange'
  | 'green'
  | 'sky'
  | 'gray'
  | 'red'
  | 'yellow'
  | 'default';

interface BrandBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  blue:    { bg: 'bg-brand-blue-subtle',   text: 'text-brand-blue',        dot: 'bg-brand-blue' },
  orange:  { bg: 'bg-brand-orange-subtle', text: 'text-brand-orange-dark', dot: 'bg-brand-orange' },
  green:   { bg: 'bg-emerald-50',          text: 'text-emerald-700',       dot: 'bg-emerald-500' },
  sky:     { bg: 'bg-brand-sky-subtle',    text: 'text-brand-sky-dark',    dot: 'bg-brand-sky' },
  gray:    { bg: 'bg-muted',               text: 'text-muted-foreground',  dot: 'bg-muted-foreground' },
  red:     { bg: 'bg-red-50',              text: 'text-red-700',           dot: 'bg-red-500' },
  yellow:  { bg: 'bg-yellow-50',           text: 'text-yellow-700',        dot: 'bg-yellow-500' },
  default: { bg: 'bg-muted',               text: 'text-muted-foreground',  dot: 'bg-muted-foreground' },
};

const statusMap: Record<string, BadgeVariant> = {
  접수완료: 'green',
  결제완료: 'green',
  수강완료: 'green',
  진행중:   'blue',
  수강중:   'blue',
  신규:    'orange',
  마감임박: 'yellow',
  마감:    'gray',
  취소:    'red',
  환불요청: 'red',
  임시저장: 'gray',
  결제대기: 'yellow',
  검토중:  'sky',
};

export function BrandBadge({ variant = 'default', children, className, dot }: BrandBadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        styles.bg,
        styles.text,
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = statusMap[status] ?? 'gray';
  return (
    <BrandBadge variant={variant} dot className={className}>
      {status}
    </BrandBadge>
  );
}
