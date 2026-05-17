'use client';

import Link from 'next/link';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CreditCard, Bell, Settings, FileText, HelpCircle,
  MessageSquare, Library, ImageIcon, Link as LinkIcon, Video, UserCheck, Award, BarChart3,
} from 'lucide-react';
import { AppSidebar, type SidebarNavGroup } from '@/components/layout/AppSidebar';

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
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        variant="dark"
        eyebrow="관리자"
        homeHref="/admin/dashboard"
        groups={navGroups}
        width="md"
        footer={
          <Link href="/" className="text-xs text-white/60 hover:text-white">
            ← 사이트로 돌아가기
          </Link>
        }
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
