'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CreditCard, Bell, Settings, FileText, HelpCircle,
  MessageSquare, Library, ImageIcon, Link as LinkIcon, Video, UserCheck, Award, BarChart3,
  FileQuestion, SquarePen, Bot, LogOut,
} from 'lucide-react';
import { SidebarShell } from '@/components/layout/SidebarShell';
import { type SidebarNavGroup } from '@/components/layout/AppSidebar';
import { PageLoader } from '@/components/ui/page-loader';
import {
  ensureAuthCookieSync,
  forceLogoutToLogin,
  logout,
  verifyAuthSession,
} from '@/lib/auth';

const ADMIN_ROLES = ['OPERATOR', 'SUPER_ADMIN'];

async function handleAdminLogout() {
  // 서버측 토큰 무효화 + 로컬 토큰 정리 후 전체 이동 — 잔존 세션으로 대시보드로 튕기지 않도록
  await logout();
  window.location.assign('/login');
}

const navGroups: SidebarNavGroup[] = [
  {
    label: '대시보드',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: '대시보드' },
      { href: '/admin/analytics', icon: BarChart3, label: '접속 통계' },
    ],
  },
  {
    label: '교육',
    items: [
      { href: '/admin/courses', icon: BookOpen, label: '교육과정 관리', matchPrefix: true },
      { href: '/admin/textbooks', icon: Library, label: '교재 관리', matchPrefix: true },
      { href: '/admin/cms', icon: FileText, label: '콘텐츠 CMS' },
      { href: '/admin/cms/review', icon: FileText, label: 'CMS 승인함' },
    ],
  },
  {
    label: '시험 & 결제',
    items: [
      { href: '/admin/exam', icon: ClipboardList, label: '시험 접수 관리', matchPrefix: true },
      { href: '/admin/exam/authoring', icon: SquarePen, label: '시험 출제 관리', matchPrefix: true },
      { href: '/admin/exam/questions', icon: FileQuestion, label: '문제은행', matchPrefix: true },
      { href: '/admin/qualifications', icon: Award, label: '자격 소개 관리' },
      { href: '/admin/referrers', icon: UserCheck, label: '권유자 관리' },
      { href: '/admin/payments', icon: CreditCard, label: '결제 관리' },
      { href: '/admin/vouchers', icon: CreditCard, label: '무료 이용권 관리' },
    ],
  },
  {
    label: '회원',
    items: [
      { href: '/admin/users', icon: Users, label: '회원 관리', matchPrefix: true },
    ],
  },
  {
    label: '커뮤니케이션',
    items: [
      { href: '/admin/notices', icon: Bell, label: '공지사항', matchPrefix: true },
      { href: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
      { href: '/admin/inquiries', icon: MessageSquare, label: '1:1 문의' },
      { href: '/admin/qmi', icon: Bot, label: '큐미 RAG 데이터' },
    ],
  },
  {
    label: '사이트 관리',
    items: [
      { href: '/admin/banner', icon: ImageIcon, label: '히어로 배너' },
      { href: '/admin/intro', icon: FileText, label: '소개 페이지 CMS' },
      { href: '/admin/book-offers', icon: LinkIcon, label: '북이오 링크 관리' },
      { href: '/admin/shorts', icon: Video, label: '홍보영상 관리' },
      { href: '/admin/settings', icon: Settings, label: '시스템 설정' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  // 관리자 레이아웃 게이트: middleware 는 쿠키 존재만 확인하므로, 일반 회원이라도
  // /admin/* 셸이 렌더될 수 있다. 여기서 역할을 검증해 비관리자는 접근을 차단한다.
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
      if (!ADMIN_ROLES.includes(session.role ?? '')) {
        // 인증됐지만 관리자 권한 없음 — 세션은 유지한 채 사용자 영역으로 보낸다.
        router.replace('/mypage');
        return;
      }
      setAuthReady(true);
    };

    boot();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!authReady) {
    return <PageLoader />;
  }

  return (
    <SidebarShell
      mobileTitle="관리자"
      sidebarProps={{
        variant: 'dark',
        eyebrow: '관리자',
        homeHref: '/admin/dashboard',
        groups: navGroups,
        width: 'md',
        footer: (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> 로그아웃
            </button>
            <Link href="/" className="block text-xs text-white/60 hover:text-white">
              ← 사이트로 돌아가기
            </Link>
          </div>
        ),
      }}
    >
      <div className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 md:p-8">{children}</div>
    </SidebarShell>
  );
}
