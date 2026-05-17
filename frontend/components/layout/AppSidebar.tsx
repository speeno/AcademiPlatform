'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** 정확 매칭 대신 prefix 매칭으로 active 판정 (기본 false) */
  matchPrefix?: boolean;
}

export interface SidebarNavGroup {
  /** 그룹 라벨 — 없으면 라벨 없이 항목만 렌더 (단일 그룹 light variant) */
  label?: string;
  items: SidebarNavItem[];
}

export type SidebarVariant = 'light' | 'dark';

interface AppSidebarProps {
  variant?: SidebarVariant;
  /** 로고 우측/하단의 보조 라벨 (예: "마이페이지", "관리자") */
  eyebrow?: string;
  /** 로고 클릭 시 이동할 경로 */
  homeHref?: string;
  groups: SidebarNavGroup[];
  /** 하단 슬롯 (예: "← 홈으로" 링크) */
  footer?: ReactNode;
  /** 너비 — 기본 56 (14rem). Admin 등 항목이 많을 때 60(15rem) */
  width?: 'sm' | 'md';
  className?: string;
}

const widthClasses: Record<NonNullable<AppSidebarProps['width']>, string> = {
  sm: 'w-56',
  md: 'w-60',
};

/**
 * Classroom·Admin 공통 좌측 사이드바.
 *
 * - `variant="light"` → 흰 배경 + 텍스트 muted (Classroom)
 * - `variant="dark"`  → 짙은 배경 + 흰 텍스트 (Admin)
 * - active 상태는 `usePathname()` 기준 자동 처리.
 * - 그룹 라벨이 없으면 단순 목록 형태로 표시.
 */
export function AppSidebar({
  variant = 'light',
  eyebrow,
  homeHref,
  groups,
  footer,
  width = 'sm',
  className,
}: AppSidebarProps) {
  const pathname = usePathname() ?? '';

  const isDark = variant === 'dark';

  const containerClasses = cn(
    'flex flex-col shrink-0',
    widthClasses[width],
    isDark
      ? 'bg-brand-blue-dark text-white border-r border-white/10'
      : 'bg-background text-foreground border-r border-border',
    className,
  );

  const dividerClasses = isDark ? 'border-white/10' : 'border-border';

  const eyebrowClasses = isDark ? 'text-white/60' : 'text-muted-foreground';

  const groupLabelClasses = cn(
    'px-4 mb-1 text-xs font-semibold uppercase tracking-wider',
    isDark ? 'text-white/50' : 'text-muted-foreground',
  );

  const linkBaseClasses = cn(
    'flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-md mx-1',
    isDark
      ? 'text-white/80 hover:bg-white/10 hover:text-white'
      : 'text-muted-foreground hover:bg-brand-blue-subtle hover:text-brand-blue',
  );

  const linkActiveClasses = isDark
    ? 'bg-white/15 text-white'
    : 'bg-brand-blue-subtle text-brand-blue font-semibold';

  const isActive = (item: SidebarNavItem) => {
    if (!pathname) return false;
    return item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href;
  };

  return (
    <aside className={containerClasses}>
      <div className={cn('p-4 border-b', dividerClasses)}>
        <Logo size="sm" href={homeHref} />
        {eyebrow ? <p className={cn('text-xs mt-1 ml-0.5', eyebrowClasses)}>{eyebrow}</p> : null}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={group.label ?? `g${gi}`} className={cn(group.label ? 'mb-5' : 'mb-2')}>
            {group.label ? <p className={groupLabelClasses}>{group.label}</p> : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(linkBaseClasses, isActive(item) && linkActiveClasses)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {footer ? (
        <div className={cn('p-4 border-t', dividerClasses)}>
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
