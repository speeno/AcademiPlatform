import Link from 'next/link';
import { LogoHorizontal } from './Logo';
import { Mail, MapPin } from 'lucide-react';

const footerLinks = {
  소개: [
    { label: 'ISO/IEC 17024 자격 개요', href: '/about/qualification' },
    { label: '자격 취득 이점', href: '/about/benefits' },
    { label: '활용 분야', href: '/about/fields' },
    { label: '기관 소개', href: '/about/organization' },
    { label: '대표 강사 소개', href: '/about/instructors' },
  ],
  교육과정: [
    { label: '과정 목록', href: '/courses' },
    { label: '수강 신청', href: '/courses#enroll' },
    { label: '라이브/설명회', href: '/live' },
    { label: 'AI Tip 영상', href: '/shorts' },
    { label: '온라인 교재', href: '/textbooks' },
    { label: '교재 별도 구매', href: '/books' },
  ],
  시험접수: [
    { label: '시험 안내', href: '/about/exam' },
    { label: '시험 일정', href: '/exam' },
    { label: '마이페이지', href: '/mypage' },
  ],
  고객지원: [
    { label: '공지사항', href: '/notices' },
    { label: 'FAQ', href: '/faq' },
    { label: '1:1 문의', href: '/contact' },
    { label: '개인정보처리방침', href: '/privacy' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-blue-dark text-white/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* 브랜드 */}
          <div className="lg:col-span-1">
            <div className="mb-3">
              <LogoHorizontal height={45} />
            </div>
            <p className="text-sm italic mb-4 text-brand-sky">Learn · Certify · Succeed</p>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>academiq2026@gmail.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>성사동 롯데캐슬스카이엘 107-2301</span>
              </div>
            </div>
          </div>

          {/* 링크 그룹 */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 로고 그라디언트 구분선 */}
        <div className="mt-10 mb-6 h-px bg-logo-gradient opacity-40" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/60">
          <div className="text-center md:text-left">
            <p>© 2026 AcademiQ. All rights reserved.</p>
            <p className="mt-1 text-[11px]">
              맨도롱북스 | 사업자등록번호: 706-99-02056 | 대표자: 전미헌
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
