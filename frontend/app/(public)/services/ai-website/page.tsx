import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Globe,
  Sparkles,
  LayoutTemplate,
  Search,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'AI 홈페이지 제작·운영 상담',
  description:
    'AI 기반 홈페이지 제작·운영 상담. 브랜드에 맞는 웹사이트 기획부터 제작·운영까지 AcademiQ가 함께합니다.',
};

const valueProps = [
  {
    icon: LayoutTemplate,
    accent: 'blue' as const,
    title: '브랜드 맞춤 설계',
    desc: '업종·목표·타깃에 맞는 정보 구조와 디자인으로 홈페이지를 기획합니다.',
  },
  {
    icon: Sparkles,
    accent: 'orange' as const,
    title: 'AI 콘텐츠·자동화',
    desc: 'AI 도구를 활용해 카피·이미지·업데이트 흐름을 효율적으로 구성합니다.',
  },
  {
    icon: Search,
    accent: 'sky' as const,
    title: '검색·전환 최적화',
    desc: '검색 노출과 문의 전환을 고려한 페이지 구성과 CTA를 설계합니다.',
  },
  {
    icon: RefreshCw,
    accent: 'green' as const,
    title: '운영·유지보수',
    desc: '오픈 이후 콘텐츠 갱신·기능 개선·운영 지원까지 이어갑니다.',
  },
];

const offerings = [
  {
    title: '신규 홈페이지 제작',
    desc: '브랜드 소개·서비스·문의까지 포함한 신규 사이트 기획·제작.',
    tag: '신규',
  },
  {
    title: '기존 사이트 리뉴얼',
    desc: '노후화된 사이트를 현대적인 UI·모바일 대응 구조로 개선합니다.',
    tag: '리뉴얼',
  },
  {
    title: '랜딩·캠페인 페이지',
    desc: '프로모션·설명회·상담 유도용 단일 목적 페이지 제작.',
    tag: '캠페인',
  },
  {
    title: '운영·콘텐츠 지원',
    desc: '정기 업데이트, SEO·문의 연동 등 지속 운영 컨설팅.',
    tag: '운영',
  },
];

export default function AiWebsiteServicePage() {
  return (
    <div>
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <p className="text-sm font-semibold mb-2 text-brand-orange">AI 홈페이지</p>
              <h1 className="text-4xl font-extrabold mb-4 text-brand-blue leading-tight">
                AI 홈페이지<br />
                <span className="text-brand-orange">제작·운영 상담</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                브랜드에 맞는 웹사이트를 AI 활용과 함께 기획·제작·운영합니다.
                상담을 통해 목표와 예산에 맞는 방향을 안내해 드립니다.
              </p>
              <Link href="/contact?category=AI%20홈페이지%20제작%C2%B7%EC%9A%B4%EC%98%81%20%EC%83%81%EB%8B%B4">
                <BrandButton variant="primary" size="lg">
                  1:1 문의하기 <ArrowRight className="w-4 h-4" />
                </BrandButton>
              </Link>
            </div>
            <div className="hidden md:flex justify-center">
              <div
                className="w-44 h-44 rounded-3xl flex items-center justify-center"
                style={{ background: 'var(--gradient-logo)' }}
              >
                <Globe className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">서비스 특징</h2>
            <p className="text-muted-foreground">기획부터 오픈·운영까지 한 흐름으로 지원합니다</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map(({ icon: Icon, accent, title, desc }) => (
              <BrandCard key={title} accent={accent} padding="lg">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-brand-blue-subtle">
                  <Icon className="w-5 h-5 text-brand-blue" />
                </div>
                <BrandCardTitle className="mb-2">{title}</BrandCardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </Section>

      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">상담 범위</h2>
            <p className="text-muted-foreground">필요에 따라 단계별로 선택하거나 조합할 수 있습니다</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {offerings.map((item) => (
              <BrandCard key={item.title} accent="blue" padding="lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <BrandCardTitle className="text-lg">{item.title}</BrandCardTitle>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-blue-subtle text-brand-blue shrink-0">
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </Section>

      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">AI 홈페이지 상담이 필요하신가요?</h2>
          <p className="text-white/85 mb-8">
            목표와 일정을 알려주시면 맞춤 제안을 안내해 드립니다. 전화 상담 없이 문의 폼으로 접수됩니다.
          </p>
          <Link href="/contact?category=AI%20홈페이지%20제작%C2%B7%EC%9A%B4%EC%98%81%20%EC%83%81%EB%8B%B4">
            <BrandButton size="lg" className="min-h-11 shadow-lg">
              1:1 문의하기 <MessageSquare className="w-4 h-4" />
            </BrandButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
