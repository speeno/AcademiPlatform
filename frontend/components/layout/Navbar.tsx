'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Menu, X, BookOpen, LogIn, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brand-button';
import { Logo } from './Logo';
import { buildAuthHeader, clearAccessToken, subscribeAuthState } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';

const navItems = [
  { label: '소개', href: '/about' },
  { label: '교육과정', href: '/courses' },
  { label: '시험접수', href: '/exam' },
  { label: '라이브/설명회', href: '/live' },
  { label: 'AI Tip 영상', href: '/shorts' },
  { label: '공지사항', href: '/notices' },
  { label: 'FAQ', href: '/faq' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          headers: buildAuthHeader(false),
        });
        if (!active) return;

        if (!res.ok) {
          setIsAuthenticated(false);
          setUserName('');
          setUserEmail('');
          setUserRole('');
          return;
        }

        const me = await res.json();
        setIsAuthenticated(true);
        setUserName(me?.name ?? '');
        setUserEmail(me?.email ?? '');
        setUserRole(me?.role ?? '');
      } catch {
        if (!active) return;
        setIsAuthenticated(false);
        setUserName('');
        setUserEmail('');
        setUserRole('');
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    loadMe();
    const unsubscribe = subscribeAuthState(() => {
      if (active) loadMe();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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
    setIsAuthenticated(false);
    setUserName('');
    setUserEmail('');
    setUserRole('');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Logo size="md" />

          {/* PC 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-brand-blue rounded-md hover:bg-brand-blue-subtle transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 버튼 그룹 */}
          <div className="hidden md:flex items-center gap-2">
            <Link href={myEntryHref}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-blue">
                {isAdmin ? <Shield className="w-4 h-4 mr-1" /> : <BookOpen className="w-4 h-4 mr-1" />}
                {myEntryLabel}
              </Button>
            </Link>
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
                <span className="text-sm font-semibold text-foreground px-1">{displayName}님</span>
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

          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기/닫기"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 브랜드 그라디언트 하단 라인 */}
      <div className="h-0.5 w-full bg-logo-gradient" />

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
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
            <Link href={myEntryHref} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full text-foreground">
                {isAdmin ? <Shield className="w-4 h-4 mr-1" /> : <BookOpen className="w-4 h-4 mr-1" />}
                {myEntryLabel}
              </Button>
            </Link>
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
