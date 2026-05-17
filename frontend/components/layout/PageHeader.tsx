import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** 제목 위에 표시되는 보조 라벨 (eyebrow). 예: "관리자", "교육과정" */
  eyebrow?: ReactNode;
  /** 우측 액션 슬롯 (CTA 버튼 등) — children 으로도 받을 수 있음 */
  actions?: ReactNode;
}

/**
 * 페이지 상단 공통 헤더.
 *
 * - heading 위계 클래스 통일: `text-heading`.
 * - eyebrow 는 brand-orange 강조, description 은 `text-caption`.
 * - 우측 CTA 는 `actions` 또는 children 슬롯으로 전달.
 *
 * 사용 예:
 * ```tsx
 * <PageHeader title="강의 목록" description="현재 진행 중인 교육과정" />
 * <PageHeader title="회원 관리" actions={<BrandButton>신규 회원</BrandButton>} />
 * ```
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  children,
  ...props
}: PageHeaderProps) {
  const trailing = actions ?? children;

  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 border-b border-border pb-5',
        'md:mb-8 md:flex-row md:items-end md:justify-between md:gap-6',
        className,
      )}
      {...props}
    >
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-heading text-brand-blue">{title}</h1>
        {description ? <p className="text-caption">{description}</p> : null}
      </div>

      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
