import Link from 'next/link';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  CreditCard, Bell, Settings, FileText, HelpCircle,
  MessageSquare, Library, ImageIcon, Link as LinkIcon,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const navGroups = [
  {
    label: '대시보드',
    items: [{ href: '/admin/dashboard', icon: LayoutDashboard, label: '대시보드' }],
  },
  {
    label: '교육',
    items: [
      { href: '/admin/courses', icon: BookOpen, label: '교육과정 관리' },
      { href: '/admin/textbooks', icon: Library, label: '교재 관리' },
      { href: '/admin/cms', icon: FileText, label: '콘텐츠 CMS' },
      { href: '/admin/cms/review', icon: FileText, label: 'CMS 승인함' },
    ],
  },
  {
    label: '시험 & 결제',
    items: [
      { href: '/admin/exam', icon: ClipboardList, label: '시험 접수 관리' },
      { href: '/admin/payments', icon: CreditCard, label: '결제 관리' },
      { href: '/admin/vouchers', icon: CreditCard, label: '무료 이용권 관리' },
    ],
  },
  {
    label: '회원',
    items: [
      { href: '/admin/users', icon: Users, label: '회원 관리' },
    ],
  },
  {
    label: '커뮤니케이션',
    items: [
      { href: '/admin/notices', icon: Bell, label: '공지사항' },
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
      { href: '/admin/settings', icon: Settings, label: '시스템 설정' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <Logo size="sm" href="/admin/dashboard" />
          <p className="text-xs text-gray-400 mt-1 ml-0.5">관리자</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-4 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md mx-1"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="text-xs text-gray-400 hover:text-white">
            ← 사이트로 돌아가기
          </Link>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
