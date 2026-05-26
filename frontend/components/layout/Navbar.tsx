'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Menu, X, BookOpen, LogIn, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brand-button';
import { Logo } from './Logo';
import { clearAccessToken } from '@/lib/auth';
import { useAuthContext } from '@/lib/auth-context';

const navItems = [
  { label: '서비스', href: '/services' },
  { label: '소개', href: '/about' },
  { label: '교육과정', href: '/courses' },
  { label: '교재 구매', href: '/store/textbooks' },
  { label: '시험접수', href: '/exam' },
  { label: '라이브/설명회', href: '/live' },
  { label: 'AI Tip 영상', href: '/shorts' },
  { label: '공지사항', href: '/notices' },
  { label: 'FAQ', href: '/faq' },
];

export function Navbar() {
  const pathname = usePathname();
  const auth = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const authLoading = auth?.isLoggedIn == null;
  const isAuthenticated = auth?.isLoggedIn === true;
  const userName = auth?.me?.name ?? '';
  const userEmail = auth?.me?.email ?? '';
  const userRole = auth?.me?.role ?? '';

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const original = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? 'hidden' : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const isAdmin = useMemo(
    () => userRole === 'SUPER_ADMIN' || userRole === 'OPERATOR',
    [userRole],
  );
  const isInstructor = useMemo(
    () => userRole === 'INSTRUCTOR',
    [userRole],
  );
  const myEntryHref = isAdmin ? '/admin/dashboard' : isInstructor ? '/classroom/instructor/cms' : '/classroom';
  const myEntryLabel = isAdmin ? '관리자' : isInstructor ? '강사 CMS' : '내 강의실';
  const displayName = (userName || userEmail.split('@')[0] || '회원').trim();

  const handleLogout = () => {
    clearAccessToken();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center gap-3">
          {/* 로고 */}
          <div className="flex items-center shrink-0">
            <div className="lg:hidden">
              <Logo size="xs" />
            </div>
            <div className="hidden lg:block">
              <Logo size="md" />
            </div>
          </div>

          {/* PC 네비게이션 */}
          <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-brand-blue-subtle hover:text-brand-blue xl:px-3 xl:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 버튼 그룹 */}
          <div className="hidden shrink-0 lg:flex items-center gap-2">
            {isAuthenticated && (
              <Link href={myEntryHref}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-blue">
                  {isAdmin ? <Shield className="w-4 h-4 mr-1" /> : <BookOpen className="w-4 h-4 mr-1" />}
                  {myEntryLabel}
                </Button>
              </Link>
            )}
            {authLoading ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-brand-blue text-brand-blue hover:bg-brand-blue-subtle"
              >
                확인중...
              </Button>
            ) : isAuthenticated ? (
              <>
                <span className="max-w-[7rem] truncate px-1 text-sm font-semibold text-foreground xl:max-w-[10rem]">
                  {displayName}님
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-brand-blue text-brand-blue hover:bg-brand-blue-subtle"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  로그아웃
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-brand-blue text-brand-blue hover:bg-brand-blue-subtle">
                  <LogIn className="w-4 h-4 mr-1" />
                  로그인
                </Button>
              </Link>
            )}
            <Link href="/courses">
              <BrandButton size="sm" variant="primary">
                수강 신청
              </BrandButton>
            </Link>
          </div>

          {/* 모바일 햄버거 — lg 미만에서 PC 영역이 숨겨지므로 ml-auto로 우측 정렬 */}
          <button
            className="ml-auto lg:hidden p-2 rounded-md text-muted-foreground hover:bg-brand-blue-subtle hover:text-brand-blue"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 브랜드 그라디언트 하단 라인 */}
      <div className="h-0.5 w-full bg-logo-gradient" />

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-brand-blue rounded-md hover:bg-brand-blue-subtle"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {isAuthenticated && (
              <Link href={myEntryHref} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground">
                  {isAdmin ? <Shield className="w-4 h-4 mr-1" /> : <BookOpen className="w-4 h-4 mr-1" />}
                  {myEntryLabel}
                </Button>
              </Link>
            )}
            {authLoading ? (
              <Button variant="outline" disabled className="w-full border-brand-blue text-brand-blue">
                확인중...
              </Button>
            ) : isAuthenticated ? (
              <>
                <div className="px-2 text-sm text-muted-foreground">{displayName}님 로그인됨</div>
                <Button variant="outline" className="w-full border-brand-blue text-brand-blue" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  로그아웃
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-brand-blue text-brand-blue">
                  <LogIn className="w-4 h-4 mr-1" />
                  로그인
                </Button>
              </Link>
            )}
            <Link href="/courses" onClick={() => setMobileOpen(false)}>
              <BrandButton variant="primary" fullWidth>
                수강 신청
              </BrandButton>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
