import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Globe, TrendingUp, Users, Briefcase } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소개',
  description: 'ISO/IEC 17024 기반 AI 자격 교육 기관 AcademiQ를 소개합니다.',
};

const introMenuItems = [
  {
    href: '/about/qualification',
    icon: Award,
    title: 'ISO/IEC 17024 자격 개요',
    desc: '국제 표준 기반의 AI 개인 자격 인증 체계와 공신력을 확인하세요.',
    color: 'var(--brand-blue)',
    bg: 'var(--brand-blue-subtle)',
    accent: 'blue' as const,
  },
  {
    href: '/about/benefits',
    icon: TrendingUp,
    title: '자격 취득 이점',
    desc: '객관적 역량 인증부터 경쟁력 향상까지, 취득의 가치를 알아보세요.',
    color: 'var(--brand-orange)',
    bg: 'var(--brand-orange-subtle)',
    accent: 'orange' as const,
  },
  {
    href: '/about/fields',
    icon: Briefcase,
    title: '자격 취득 후 활동 분야',
    desc: '교육, 창업, 코칭, 마케팅 등 다양한 분야에서의 활용처를 확인하세요.',
    color: 'var(--brand-green)',
    bg: '#E8F6EF',
    accent: 'green' as const,
  },
  {
    href: '/about/exam',
    icon: BookOpen,
    title: '시험 안내',
    desc: '응시 절차, 준비물, 일정 안내를 확인하고 시험을 준비하세요.',
    color: 'var(--brand-sky)',
    bg: 'var(--brand-sky-subtle)',
    accent: 'sky' as const,
  },
  {
    href: '/about/organization',
    icon: Globe,
    title: '기관 소개',
    desc: '운영 기관의 철학, 강사진, 파트너십을 소개합니다.',
    color: 'var(--brand-blue-light)',
    bg: 'var(--brand-blue-subtle)',
    accent: 'blue' as const,
  },
  {
    href: '/about/instructors',
    icon: Users,
    title: '대표 강사 소개',
    desc: 'AcademiQ 대표 강사의 전문성과 주요 이력을 확인하세요.',
    color: 'var(--brand-green)',
    bg: '#E8F6EF',
    accent: 'green' as const,
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* 헤더 */}
      <section className="bg-hero-gradient py-16 border-b">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4" style={{ color: 'var(--brand-blue)' }}>
            AcademiQ <span style={{ color: 'var(--brand-orange)' }}>소개</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ISO/IEC 17024 국제 표준 기반의 AI 자격 교육 플랫폼.<br />
            자격의 가치부터 활용까지, 모든 정보를 한 곳에서 확인하세요.
          </p>
        </div>
      </section>

      {/* 소개 메뉴 카드 */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {introMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <BrandCard accent={item.accent} hoverable padding="lg" className="h-full">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: item.bg }}
                    >
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                    <div className="flex items-center text-sm font-medium" style={{ color: item.color }}>
                      자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </BrandCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--brand-blue)' }}>
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-500 mb-6">교육 신청이나 시험 접수에 대해 궁금한 점이 있으신가요?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/courses">
              <BrandButton variant="primary">교육과정 보기 <ArrowRight className="w-4 h-4" /></BrandButton>
            </Link>
            <Link href="/contact">
              <BrandButton variant="outline">상담 문의</BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
