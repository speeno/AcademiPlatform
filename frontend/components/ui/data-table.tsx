import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  /** 컬럼 키 — React key 및 cell renderer 의 식별자 */
  key: string;
  header: ReactNode;
  /** 셀 렌더러. row, index 를 받음. */
  cell: (row: T, index: number) => ReactNode;
  /** 추가 클래스 (text-right, w-[120px] 등) */
  className?: string;
  /** header 셀에만 적용되는 추가 클래스 */
  headerClassName?: string;
  /** 모바일에서 숨김 (default false) */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** 빈 상태 노드 */
  empty?: ReactNode;
  /** 로딩 상태 — true 면 스켈레톤 표시 */
  loading?: boolean;
  /** 로딩 시 보여줄 행 수 (기본 6) */
  skeletonRows?: number;
  className?: string;
  /** 행 클릭 핸들러 (선택) */
  onRowClick?: (row: T, index: number) => void;
  /** 행에 추가 클래스 적용 */
  rowClassName?: (row: T, index: number) => string | undefined;
  /** 전체 컨테이너 padding 제거 (외곽 카드가 이미 있을 때) */
  bare?: boolean;
}

/**
 * Admin·CMS 공통 테이블 컴포넌트.
 *
 * - 토큰 기반 색상(border-border, bg-muted, text-muted-foreground).
 * - 빈 상태·로딩 스켈레톤·행 클릭을 표준화.
 *
 * 사용 예:
 * ```tsx
 * <DataTable
 *   columns={[
 *     { key: 'name', header: '이름', cell: (u) => u.name },
 *     { key: 'role', header: '권한', cell: (u) => u.role, className: 'w-32' },
 *   ]}
 *   rows={users}
 *   rowKey={(u) => u.id}
 *   empty={<p>회원이 없습니다.</p>}
 * />
 * ```
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  skeletonRows = 6,
  className,
  onRowClick,
  rowClassName,
  bare,
}: DataTableProps<T>) {
  const containerClasses = cn(
    bare ? '' : 'overflow-hidden rounded-xl border border-border bg-card',
    className,
  );

  return (
    <div className={containerClasses}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.headerClassName ?? col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3',
                        col.hideOnMobile && 'hidden md:table-cell',
                        col.className,
                      )}
                    >
                      <div className="h-3 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  {empty ?? '표시할 데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const extraRowClass = rowClassName?.(row, idx);
                return (
                  <tr
                    key={rowKey(row, idx)}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/30',
                      extraRowClass,
                    )}
                    onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-3 py-3 text-foreground',
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.className,
                        )}
                      >
                        {col.cell(row, idx)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
