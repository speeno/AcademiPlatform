'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brand-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './Logo';
import { clearAccessToken } from '@/lib/auth';
import { useAuthContext } from '@/lib/auth-context';
import {
  PUBLIC_NAV_PRIMARY_COUNT,
  publicNavItems,
  publicNavLinkClass,
  publicNavMobileLinkClass,
} from '@/lib/site-nav';

export function Navbar() {
  const pathname = usePathname();
  const auth = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const authLoading = auth?.isLoggedIn == null;
  const isAuthenticated = auth?.isLoggedIn === true;
  const userName = auth?.me?.name ?? '';
  const userEmail = auth?.me?.email ?? '';
  const userRole = auth?.me?.role ?? '';
  const displayName = (userName || userEmail.split('@')[0] || '회원').trim();
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'OPERATOR';
  const isInstructor = userRole === 'INSTRUCTOR';
  const roleEntry = isAdmin
    ? { href: '/admin/dashboard', label: '관리자', Icon: Shield }
    : isInstructor
      ? { href: '/classroom/instructor/cms', label: '강사 CMS', Icon: UserRound }
      : { href: '/classroom', label: '내 강의실', Icon: BookOpen };
  const RoleEntryIcon = roleEntry.Icon;
  const primaryNavItems = publicNavItems.slice(0, PUBLIC_NAV_PRIMARY_COUNT);
  const overflowNavItems = publicNavItems.slice(PUBLIC_NAV_PRIMARY_COUNT);

  const renderNavLink = (item: (typeof publicNavItems)[number]) => (
    <Link key={item.href} href={item.href} className={publicNavLinkClass}>
      <span>{item.label}</span>
      <span className="absolute left-2 right-2 -bottom-0.5 h-0.5 scale-x-0 rounded-full bg-brand-orange transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );

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

  const handleLogout = () => {
    clearAccessToken();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/82">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center gap-3">
          <div className="flex items-center shrink-0">
            <div className="xl:hidden">
              <Logo size="xs" />
            </div>
            <div className="hidden xl:block">
              <Logo size="sm" />
            </div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden xl:flex 2xl:hidden">
            {primaryNavItems.map(renderNavLink)}
            {overflowNavItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`${publicNavLinkClass} inline-flex items-center gap-0.5`}
                  aria-label="추가 메뉴"
                >
                  더보기
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-40">
                  {overflowNavItems.map((item) => (
                    <DropdownMenuItem key={item.href}>
                      <Link href={item.href} className="flex w-full items-center">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 2xl:flex">
            {publicNavItems.map(renderNavLink)}
          </nav>

          <div className="relative z-10 hidden shrink-0 items-center gap-1.5 border-l border-border/50 bg-white/95 pl-2 xl:flex 2xl:gap-2 2xl:pl-3">
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 max-w-[9.5rem] items-center gap-1 rounded-md border border-brand-blue bg-white px-3 text-sm font-medium text-brand-blue hover:bg-brand-blue-subtle 2xl:max-w-[11rem]"
                >
                  <RoleEntryIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{displayName}님</span>
                  <ChevronDown className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem>
                    <Link href={roleEntry.href} className="flex w-full items-center gap-1.5">
                      <RoleEntryIcon className="h-4 w-4" />
                      {roleEntry.label}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-1.5">
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-brand-blue text-brand-blue hover:bg-brand-blue-subtle">
                  <LogIn className="w-4 h-4 mr-1" />
                  로그인
                </Button>
              </Link>
            )}
            <Link href="/courses">
              <BrandButton size="sm" variant="primary" className="whitespace-nowrap px-3 2xl:px-4">
                수강 신청
              </BrandButton>
            </Link>
          </div>

          <button
            className="ml-auto xl:hidden min-h-12 min-w-12 p-2 rounded-md text-muted-foreground hover:bg-brand-blue-subtle hover:text-brand-blue"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-logo-gradient opacity-60" />

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="xl:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto"
        >
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={publicNavMobileLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {authLoading ? (
              <Button variant="outline" disabled className="w-full border-brand-blue text-brand-blue">
                확인중...
              </Button>
            ) : isAuthenticated ? (
              <>
                <div className="px-2 text-sm text-muted-foreground">{displayName}님 로그인됨</div>
                <Link href={roleEntry.href} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-brand-blue text-brand-blue">
                    <RoleEntryIcon className="w-4 h-4 mr-1" />
                    {roleEntry.label}
                  </Button>
                </Link>
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
