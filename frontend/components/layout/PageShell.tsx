import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ShellSize = 'narrow' | 'content' | 'default' | 'wide' | 'full';

interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  size?: ShellSize;
  /** padding-y 제거 (테이블 등이 직접 간격을 가질 때) */
  flush?: boolean;
}

const sizeClasses: Record<ShellSize, string> = {
  narrow: 'max-w-2xl',
  content: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

/**
 * AcademiQ 페이지 콘텐츠 래퍼.
 *
 * - 좌우 패딩·max-width 표준화 → 페이지마다 다른 `max-w-*`/`px-*` 사용 금지.
 * - Public: `default` (6xl), Auth/설정 폼: `narrow` (2xl), Admin 리스트: `wide` 또는 `full`.
 */
export function PageShell({
  size = 'default',
  flush = false,
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        flush ? '' : 'py-8 md:py-10',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
