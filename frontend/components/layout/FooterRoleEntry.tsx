'use client';

import Link from 'next/link';
import { BookOpen, Shield } from 'lucide-react';
import { useAuthContext } from '@/lib/auth-context';

/** 푸터 하단 — 관리자·강사·강의실 진입 (상단 Navbar에서 이동) */
export function FooterRoleEntry() {
  const auth = useAuthContext();
  if (!auth?.isLoggedIn) return null;

  const role = auth.me?.role ?? '';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'OPERATOR';
  const isInstructor = role === 'INSTRUCTOR';

  const href = isAdmin
    ? '/admin/dashboard'
    : isInstructor
      ? '/classroom/instructor/cms'
      : '/classroom';
  const label = isAdmin ? '관리자' : isInstructor ? '강사 CMS' : '내 강의실';

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
    >
      {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
      {label}
    </Link>
  );
}
