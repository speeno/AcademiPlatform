'use client';

import { useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';

const LG_MEDIA_QUERY = '(min-width: 1024px)';

export interface SidebarShellProps {
  /** 모바일 상단 바에 표시할 제목 */
  mobileTitle: string;
  /** AppSidebar에 전달할 props (className·onNavigate는 Shell이 관리) */
  sidebarProps: Omit<ComponentProps<typeof AppSidebar>, 'className' | 'onNavigate'>;
  /** main 영역에 추가할 클래스 (예: padding) */
  mainClassName?: string;
  children: ReactNode;
}

/**
 * Classroom·Admin 공통 레이아웃 셸.
 * - lg 미만: 사이드바 기본 닫힘, 햄버거·백드롭으로 drawer
 * - lg 이상: 사이드바 항상 표시 (Navbar와 동일 1024px 브레이크포인트)
 */
export function SidebarShell({
  mobileTitle,
  sidebarProps,
  mainClassName,
  children,
}: SidebarShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia(LG_MEDIA_QUERY);
    const applyMatch = (matches: boolean) => {
      setIsDesktop(matches);
      if (matches) setMobileOpen(false);
    };

    applyMatch(mq.matches);

    const onChange = (e: MediaQueryListEvent) => {
      applyMatch(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const sidebarStyle: CSSProperties = {
    transform: isDesktop || mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <button
        type="button"
        aria-label="메뉴 닫기"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobile}
        tabIndex={mobileOpen ? 0 : -1}
      />

      <AppSidebar
        {...sidebarProps}
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto',
          'transition-transform duration-300 ease-in-out',
          'will-change-transform',
        )}
        style={sidebarStyle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 열기"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-foreground">{mobileTitle}</span>
        </header>

        <main className={cn('flex-1 overflow-auto', mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
