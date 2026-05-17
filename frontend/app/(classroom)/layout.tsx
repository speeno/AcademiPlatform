'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ClipboardList, CreditCard, User, Library, MessageSquare, FileText,
} from 'lucide-react';
import { AppSidebar, type SidebarNavItem } from '@/components/layout/AppSidebar';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';

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
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    let active = true;
    const loadMe = async () => {
      try {
        const headers = buildAuthHeader(false);
        if (!headers.Authorization) return;
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers,
          credentials: 'include',
        });
        if (!active) return;
        if (!res.ok) {
          console.warn('[classroom] /auth/me failed:', res.status);
          return;
        }
        const me = await res.json().catch(() => ({}));
        if (!active) return;
        setRole(typeof me?.role === 'string' ? me.role : '');
      } catch (err) {
        if (!active) return;
        console.warn('[classroom] /auth/me error:', err);
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
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        variant="light"
        eyebrow="마이페이지"
        groups={[{ items: navItems }]}
        footer={
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← 홈으로
          </Link>
        }
      />

      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
