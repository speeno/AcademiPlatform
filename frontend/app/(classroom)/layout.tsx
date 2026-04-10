 'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, ClipboardList, CreditCard, User, Library, MessageSquare, FileText,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';

type NavItem = { href: string; icon: LucideIcon; label: string };

const baseNavItems: NavItem[] = [
  { href: '/classroom', icon: BookOpen, label: '내 강의실' },
  { href: '/classroom/questions', icon: MessageSquare, label: '내 질문' },
  { href: '/textbooks', icon: Library, label: '내 교재' },
  { href: '/mypage', icon: User, label: '마이페이지' },
  { href: '/mypage/applications', icon: ClipboardList, label: '시험 접수 내역' },
  { href: '/mypage/payments', icon: CreditCard, label: '결제 내역' },
  { href: '/contact', icon: MessageSquare, label: '1:1 문의' },
];

const instructorNavItems: NavItem[] = [
  { href: '/classroom/instructor/cms', icon: BookOpen, label: '강사 CMS' },
  { href: '/classroom/instructor/questions', icon: MessageSquare, label: '강사 질문함' },
  { href: '/classroom/instructor/board', icon: FileText, label: '강사 게시판' },
];

export default function ClassroomLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string>('');
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const loadMe = async () => {
      try {
        const headers = buildAuthHeader(false);
        if (!headers.Authorization) {
          if (active) setRoleLoaded(true);
          return;
        }
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers,
          credentials: 'include',
        });
        if (!active) return;
        if (!res.ok) {
          console.warn('[classroom] /auth/me failed:', res.status);
          setRoleLoaded(true);
          return;
        }
        const me = await res.json().catch(() => ({}));
        if (!active) return;
        setRole(typeof me?.role === 'string' ? me.role : '');
      } catch (err) {
        if (!active) return;
        console.warn('[classroom] /auth/me error:', err);
      } finally {
        if (active) setRoleLoaded(true);
      }
    };
    loadMe();
    return () => {
      active = false;
    };
  }, []);

  const navItems = useMemo(() => {
    const canSeeInstructorMenu =
      role === 'INSTRUCTOR' || role === 'OPERATOR' || role === 'SUPER_ADMIN';
    return canSeeInstructorMenu
      ? [...baseNavItems.slice(0, 2), ...instructorNavItems, ...baseNavItems.slice(2)]
      : baseNavItems;
  }, [role]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-56 bg-white border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Logo size="sm" />
          <p className="text-xs text-gray-400 mt-1">마이페이지</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-blue-subtle hover:text-brand-blue transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← 홈으로
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
