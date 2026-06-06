import Link from 'next/link';
import { LogoHorizontal } from './Logo';
import { Mail } from 'lucide-react';
import { FooterRoleEntry } from './FooterRoleEntry';

const footerLinks = {
  서비스: [
    { label: '핵심 서비스 한눈에', href: '/services' },
    { label: 'ISO/IEC 17024 AI 국제자격증', href: '/about/qualification' },
    { label: '기업 교육', href: '/services/corporate' },
    { label: 'Harness 기업 교육', href: '/courses/harness-program' },
    { label: 'AI 컨설팅·도입', href: '/services/consulting' },
    { label: 'AI 홈페이지', href: '/services/ai-website' },
    { label: '영상 제작 상담', href: '/services/video-production' },
    { label: '라이브·콘텐츠', href: '/live' },
  ],
  국제자격증소개: [
    { label: 'ISO/IEC 17024 자격증 개요', href: '/about/qualification' },
    { label: '자격 취득 이점', href: '/about/benefits' },
    { label: '활용 분야', href: '/about/fields' },
    { label: '기관 소개', href: '/about/organization' },
    { label: '대표 강사 소개', href: '/about/instructors' },
  ],
  자격증교육과정: [
    { label: '자격증 과정 목록', href: '/courses' },
    { label: '시험 접수', href: '/exam' },
    { label: '교재 구매', href: '/store/textbooks' },
    { label: '내 교재 열람', href: '/textbooks' },
    { label: 'AI Tip 영상', href: '/shorts' },
  ],
  시험접수: [
    { label: '시험 안내', href: '/about/exam' },
    { label: '자격증시험 온라인 접수', href: '/exam' },
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
    <footer className="bg-[#042B5C] text-white/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* 브랜드 — 모바일에서도 표시 */}
          <div className="md:col-span-3 lg:col-span-1">
            <div className="mb-3 inline-flex max-w-full rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm">
              <LogoHorizontal height={40} className="!h-8 sm:!h-[38px] lg:!h-[40px] w-auto max-w-full" />
            </div>
            <p className="text-xs sm:text-sm text-white/80 mb-2 leading-relaxed">
              기업·개인을 위한 실무형 AI 교육·컨설팅 플랫폼입니다.
            </p>
            <p className="text-xs sm:text-sm italic mb-3 sm:mb-4 text-[#7DE2D1]">
              Learn · Certify · Succeed
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="break-all">academiq2026@gmail.com</span>
              </div>
            </div>
          </div>

          {/* 링크 그룹 — md 이상(태블릿·데스크톱)에서만 표시 */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="hidden md:block">
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2">{category}</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
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
        <div className="mt-4 md:mt-6 sm:mt-8 lg:mt-10 mb-4 sm:mb-6 h-px bg-logo-gradient opacity-60" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] sm:text-xs text-white/60">
          <div className="text-center md:text-left">
            <p>© 2026 AcademiQ. All rights reserved.</p>
            <p className="mt-1">
              맨도롱북스 | 사업자등록번호: 706-99-02056 | 대표자: 전미헌
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
            <FooterRoleEntry />
            <Link href="/terms" className="hover:text-white transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
