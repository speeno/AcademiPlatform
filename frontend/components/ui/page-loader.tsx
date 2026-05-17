import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  /** 로더 크기 (기본 h-64) */
  height?: string;
  /** 추가 클래스 */
  className?: string;
  /** 로더 아이콘 크기 클래스 (기본 w-6 h-6) */
  iconSize?: string;
}

/**
 * 페이지/섹션 로딩 상태 표시용 공통 컴포넌트.
 *
 * 사용 예:
 * ```tsx
 * if (loading) return <PageLoader />;
 * if (loading) return <PageLoader height="h-40" />;
 * ```
 */
export function PageLoader({ height = 'h-64', iconSize = 'w-6 h-6', className }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', height, className)}>
      <Loader2 className={cn(iconSize, 'animate-spin text-brand-blue')} />
    </div>
  );
}
