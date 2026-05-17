import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionSpacing = 'sm' | 'md' | 'lg';

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  spacing?: SectionSpacing;
  /** 섹션 제목 (heading 단계). 제공 시 description 도 함께 표시 가능 */
  title?: ReactNode;
  description?: ReactNode;
  /** 섹션 우측 액션 슬롯 */
  actions?: ReactNode;
}

const spacingClasses: Record<SectionSpacing, string> = {
  sm: 'py-6',
  md: 'py-12',
  lg: 'py-16 md:py-20',
};

/**
 * 페이지 내 섹션 래퍼.
 *
 * - 섹션 간 수직 간격 표준화 (`py-12` 기본).
 * - 선택적 제목·설명·액션 슬롯 제공.
 */
export function Section({
  spacing = 'md',
  title,
  description,
  actions,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(spacingClasses[spacing], className)} {...props}>
      {(title || description || actions) && (
        <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            {title ? <h2 className="text-subheading text-foreground">{title}</h2> : null}
            {description ? <p className="text-caption mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
