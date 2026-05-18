import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Lightbulb,
  Search,
  Workflow,
  Rocket,
  Wrench,
  Bot,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'AI 컨설팅·도입',
  description:
    '진단·설계·실행까지. 조직 특성에 맞는 AI 도입과 업무 자동화 컨설팅으로 측정 가능한 성과를 만듭니다.',
};

const phases = [
  {
    num: '01',
    icon: Search,
    accent: 'blue' as const,
    title: '진단 · 우선순위',
    desc: '현재 업무 흐름·데이터·도구 사용 현황을 분석하고, AI 도입으로 가장 빠른 효과를 낼 영역을 식별합니다.',
    deliverables: ['현황 진단 리포트', '도입 우선순위 매트릭스', '경영진 워크숍'],
  },
  {
    num: '02',
    icon: Workflow,
    accent: 'sky' as const,
    title: '설계 · 로드맵',
    desc: '도입 대상 업무에 맞는 AI 도구·자동화 아키텍처를 설계하고, 단계별 실행 로드맵을 작성합니다.',
    deliverables: ['도입 로드맵', '자동화 아키텍처', '예산·일정 계획'],
  },
  {
    num: '03',
    icon: Rocket,
    accent: 'orange' as const,
    title: '실행 · 운영',
    desc: '파일럿·확산 단계로 나누어 실제 업무에 적용하고, 운영·내재화까지 동행하며 성과를 측정합니다.',
    deliverables: ['파일럿 운영', '내재화 교육', '성과 측정 리포트'],
  },
];

const focusAreas = [
  {
    icon: Bot,
    accent: 'blue' as const,
    title: '고객 응대 자동화',
    desc: '24시간 고객 문의 응대 챗봇, FAQ 자동화, 다국어 상담 등 고객 접점 자동화 설계.',
  },
  {
    icon: FileSpreadsheet,
    accent: 'orange' as const,
    title: '백오피스 자동화',
    desc: '재고 관리·회계 입력·보고서 자동 생성 등 노코드 기반 백오피스 업무 자동화.',
  },
  {
    icon: MessageSquare,
    accent: 'sky' as const,
    title: '콘텐츠·교육 자동화',
    desc: '직원 교육 콘텐츠·맞춤형 학습 자료·퀴즈 자동 생성, 신제품 콘셉트·디자인 시안 생성.',
  },
  {
    icon: Wrench,
    accent: 'green' as const,
    title: '맞춤 도입 설계',
    desc: '조직 고유의 업무 흐름에 맞춘 도구 선정·연동·운영 가이드 설계까지 통합 지원.',
  },
];

const faqs = [
  {
    q: '도입 규모가 작아도 의뢰할 수 있나요?',
    a: '네. 1~2개 업무 자동화부터 시작하는 단기 파일럿 프로젝트도 진행합니다. 무료 상담에서 적합한 범위를 함께 설계해 드립니다.',
  },
  {
    q: '교육과 어떻게 다른가요?',
    a: '교육이 임직원 역량 향상에 초점을 둔다면, 컨설팅은 실제 업무 프로세스를 진단하고 도구·자동화를 도입해 측정 가능한 성과를 만드는 데 초점을 둡니다. 두 가지를 함께 진행하는 경우가 많습니다.',
  },
  {
    q: '진행 기간은 얼마나 걸리나요?',
    a: '진단·설계는 2~4주, 파일럿 실행은 4~8주가 일반적입니다. 도입 범위와 조직 상황에 따라 유연하게 조정합니다.',
  },
];

export default function ConsultingServicePage() {
  return (
    <div>
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <p className="text-sm font-semibold mb-2 text-brand-orange">AI 컨설팅·도입</p>
              <h1 className="text-4xl font-extrabold mb-4 text-brand-blue leading-tight">
                AI를 <span className="text-brand-orange">실제 업무</span>에<br />
                내재화하는 가장 빠른 길
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                진단·설계·실행 3단계로 조직에 맞는 AI 도입과 업무 자동화를 함께 만듭니다.
                학습이 아니라 결과로 이야기합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact">
                  <BrandButton variant="primary" size="lg">
                    무료 상담 신청 <ArrowRight className="w-4 h-4" />
                  </BrandButton>
                </Link>
                <Link href="/services">
                  <BrandButton variant="outline" size="lg">
                    전체 서비스 보기
                  </BrandButton>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div
                className="w-44 h-44 rounded-3xl flex items-center justify-center"
                style={{ background: 'var(--gradient-logo)' }}
              >
                <Lightbulb className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">컨설팅 3단계</h2>
            <p className="text-muted-foreground">
              진단으로 시작해 운영까지 — 단계마다 명확한 산출물을 제공합니다
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {phases.map(({ num, icon: Icon, accent, title, desc, deliverables }) => (
              <BrandCard key={num} accent={accent} padding="lg" className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-blue-subtle">
                    <Icon className="w-6 h-6 text-brand-blue" />
                  </div>
                  <p className="text-xs font-bold text-brand-sky">{num}</p>
                </div>
                <BrandCardTitle className="text-lg mb-2">{title}</BrandCardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground mb-1.5">주요 산출물</p>
                  <ul className="space-y-1">
                    {deliverables.map((d) => (
                      <li
                        key={d}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-orange shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </Section>

      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">주요 도입 영역</h2>
            <p className="text-muted-foreground">
              가장 자주 진행하는 업무 자동화·AI 도입 시나리오
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {focusAreas.map(({ icon: Icon, accent, title, desc }) => (
              <BrandCard key={title} accent={accent} padding="lg" className="flex gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-blue-subtle">
                  <Icon className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <BrandCardTitle className="mb-2">{title}</BrandCardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </Section>

      <Section spacing="lg" className="bg-white">
        <PageShell size="content" flush>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">자주 묻는 질문</h2>
            <p className="text-muted-foreground">컨설팅 진행에 대해 자주 받는 문의</p>
          </div>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="bg-white border border-border rounded-xl group overflow-hidden shadow-sm"
              >
                <summary className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-muted/30 list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-foreground flex-1">{f.q}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20">
                  <p className="pt-4">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </PageShell>
      </Section>

      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">AI 도입을 검토 중이신가요?</h2>
          <p className="text-white/85 mb-8">
            현재 업무 흐름과 목표를 알려주시면, 가장 빠르게 성과를 낼 도입 경로를 함께 설계해 드립니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact">
              <BrandButton size="lg" className="min-h-11 shadow-lg">
                무료 상담 신청 <ArrowRight className="w-4 h-4" />
              </BrandButton>
            </Link>
            <Link href="/services/corporate">
              <BrandButton
                size="lg"
                variant="outline"
                className="min-h-11 border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white focus-visible:ring-white"
              >
                기업 교육 보기
              </BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
