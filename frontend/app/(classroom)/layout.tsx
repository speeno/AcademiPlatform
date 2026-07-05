'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BookOpen, ClipboardList, CreditCard, User, Library, MessageSquare, FileText, LogOut,
} from 'lucide-react';
import { SidebarShell } from '@/components/layout/SidebarShell';
import { type SidebarNavItem } from '@/components/layout/AppSidebar';
import { PageLoader } from '@/components/ui/page-loader';
import { ensureAuthCookieSync, forceLogoutToLogin, logout, verifyAuthSession } from '@/lib/auth';

const baseNavItems: SidebarNavItem[] = [
  { href: '/classroom', icon: BookOpen, label: '내 강의실', matchPrefix: true },
  { href: '/classroom/questions', icon: MessageSquare, label: '내 질문' },
  { href: '/textbooks', icon: Library, label: '내 교재', matchPrefix: true },
  { href: '/mypage', icon: User, label: '마이페이지' },
  { href: '/mypage/applications', icon: ClipboardList, label: '시험 접수 내역' },
  { href: '/mypage/payments', icon: CreditCard, label: '결제 내역' },
  { href: '/contact', icon: MessageSquare, label: '1:1 문의' },
];

const instructorNavItems: SidebarNavItem[] = [
  { href: '/classroom/instructor/cms', icon: BookOpen, label: '강사 CMS', matchPrefix: true },
  { href: '/classroom/instructor/questions', icon: MessageSquare, label: '강사 질문함' },
  { href: '/classroom/instructor/board', icon: FileText, label: '강사 게시판', matchPrefix: true },
];

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    let active = true;
    setAuthReady(false);

    const boot = async () => {
      ensureAuthCookieSync();
      const session = await verifyAuthSession();
      if (!active) return;

      if (!session.valid) {
        forceLogoutToLogin(pathname);
        return;
      }

      setRole(session.role ?? '');
      setAuthReady(true);
    };

    boot();
    return () => {
      active = false;
    };
  }, [pathname]);

  const navItems = useMemo(() => {
    const canSeeInstructorMenu =
      role === 'INSTRUCTOR' || role === 'OPERATOR' || role === 'SUPER_ADMIN';
    return canSeeInstructorMenu
      ? [...baseNavItems.slice(0, 2), ...instructorNavItems, ...baseNavItems.slice(2)]
      : baseNavItems;
  }, [role]);

  if (!authReady) {
    return <PageLoader />;
  }

  return (
    <SidebarShell
      mobileTitle="마이페이지"
      sidebarProps={{
        variant: 'light',
        eyebrow: '마이페이지',
        groups: [{ items: navItems }],
        footer: (
          <div className="space-y-2">
            <button
              type="button"
              onClick={async () => { await logout(); window.location.assign('/login'); }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> 로그아웃
            </button>
            <Link href="/" className="block text-xs text-muted-foreground hover:text-foreground">
              ← 홈으로
            </Link>
          </div>
        ),
      }}
      mainClassName="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 md:p-8"
    >
      {children}
    </SidebarShell>
  );
}
