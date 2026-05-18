import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Video,
  Clapperboard,
  Mic,
  Scissors,
  MonitorPlay,
  MessageSquare,
} from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: '영상 제작 상담',
  description:
    '홍보·교육·마케팅 영상 기획부터 제작까지. 목적에 맞는 영상 제작 상담을 AcademiQ에서 받아보세요.',
};

const valueProps = [
  {
    icon: Clapperboard,
    accent: 'blue' as const,
    title: '기획·시나리오',
    desc: '목적·타깃·채널에 맞는 영상 콘셉트와 스토리보드를 설계합니다.',
  },
  {
    icon: Mic,
    accent: 'orange' as const,
    title: '촬영·나레이션',
    desc: '인터뷰·강의·제품 소개 등 형식에 맞는 촬영·음성 가이드를 제공합니다.',
  },
  {
    icon: Scissors,
    accent: 'sky' as const,
    title: '편집·자막',
    desc: '브랜드 톤에 맞는 편집, 자막·썸네일까지 완성도 있게 마무리합니다.',
  },
  {
    icon: MonitorPlay,
    accent: 'green' as const,
    title: '배포·활용',
    desc: '유튜브·SNS·홈페이지 등 채널별 최적 포맷으로 활용을 돕습니다.',
  },
];

const offerings = [
  {
    title: '홍보·브랜드 영상',
    desc: '기업·서비스 소개, 브랜드 스토리를 담은 홍보 영상 기획·제작.',
    tag: '홍보',
  },
  {
    title: '교육·강의 영상',
    desc: '온라인 강의·설명회·튜토리얼 등 교육용 영상 제작.',
    tag: '교육',
  },
  {
    title: '숏폼·SNS 콘텐츠',
    desc: '짧은 형식의 마케팅·캠페인 영상 제작 및 채널 맞춤 편집.',
    tag: '숏폼',
  },
  {
    title: '라이브·설명회 연계',
    desc: '라이브 세션 녹화·하이라이트 편집·다시보기 콘텐츠 제작.',
    tag: '라이브',
  },
];

export default function VideoProductionServicePage() {
  return (
    <div>
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <p className="text-sm font-semibold mb-2 text-brand-orange">영상 제작</p>
              <h1 className="text-4xl font-extrabold mb-4 text-brand-blue leading-tight">
                영상 제작<br />
                <span className="text-brand-orange">상담</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                홍보·교육·마케팅 목적에 맞는 영상을 기획부터 제작까지 지원합니다.
                문의 폼으로 상담을 접수해 주시면 맞춤 안내를 드립니다.
              </p>
              <Link href="/contact?category=%EC%98%81%EC%83%81%20%EC%A0%9C%EC%9E%91%20%EC%83%81%EB%8B%B4">
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
                <Video className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">서비스 특징</h2>
            <p className="text-muted-foreground">기획·제작·배포까지 영상 제작 전 과정을 지원합니다</p>
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
            <p className="text-muted-foreground">영상 유형·분량·일정에 맞춰 견적과 일정을 안내합니다</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {offerings.map((item) => (
              <BrandCard key={item.title} accent="orange" padding="lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <BrandCardTitle className="text-lg">{item.title}</BrandCardTitle>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-orange-subtle text-brand-orange shrink-0">
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
          <h2 className="text-3xl font-extrabold mb-3">영상 제작 상담이 필요하신가요?</h2>
          <p className="text-white/85 mb-8">
            제작 목적과 참고 자료를 알려주시면 맞춤 제안을 드립니다. 전화 상담 없이 문의 폼으로 접수됩니다.
          </p>
          <Link href="/contact?category=%EC%98%81%EC%83%81%20%EC%A0%9C%EC%9E%91%20%EC%83%81%EB%8B%B4">
            <BrandButton size="lg" className="min-h-11 shadow-lg">
              1:1 문의하기 <MessageSquare className="w-4 h-4" />
            </BrandButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
