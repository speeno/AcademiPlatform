import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Lightbulb,
  Radio,
  ClipboardCheck,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: '핵심 서비스',
  description:
    '기업 교육, 개인 실무 교육, AI 컨설팅·도입, 라이브·콘텐츠까지. AcademiQ의 네 가지 핵심 서비스를 한 페이지에서 확인하세요.',
};

const services = [
  {
    icon: Building2,
    accent: 'blue' as const,
    iconBg: 'bg-brand-blue-subtle',
    iconColor: 'text-brand-blue',
    title: '기업 교육',
    summary: '직무·업종별 맞춤 커리큘럼과 B2B 운영. 팀 단위 실무 역량을 빠르게 끌어올립니다.',
    bullets: [
      '신입/실무자/리더 단계별 트랙',
      '집합·온라인·블렌디드 운영 옵션',
      '교육 후 성과 점검 리포트 제공',
    ],
    href: '/services/corporate',
    cta: '기업 교육 자세히 보기',
  },
  {
    icon: GraduationCap,
    accent: 'orange' as const,
    iconBg: 'bg-brand-orange-subtle',
    iconColor: 'text-brand-orange',
    title: '개인·실무 교육',
    summary: '온라인·라이브 강의로 AI 활용 역량을 키우고, 업무에 바로 적용합니다.',
    bullets: [
      '직무 시나리오 기반 커리큘럼',
      '결제 후 즉시 학습 시작',
      '필요 시 자격·시험 경로 연계',
    ],
    href: '/courses',
    cta: '교육과정 둘러보기',
  },
  {
    icon: Lightbulb,
    accent: 'sky' as const,
    iconBg: 'bg-brand-sky-subtle',
    iconColor: 'text-brand-sky',
    title: 'AI 컨설팅·도입',
    summary: '진단·설계·실행까지. 조직에 맞는 AI 도입과 업무 자동화를 지원합니다.',
    bullets: [
      '현황 진단 · 우선순위 워크숍',
      '도입 로드맵 · 자동화 설계',
      '실행·운영 단계까지 동행',
    ],
    href: '/services/consulting',
    cta: 'AI 컨설팅 자세히 보기',
  },
  {
    icon: Radio,
    accent: 'green' as const,
    iconBg: 'bg-brand-green/10',
    iconColor: 'text-brand-green',
    title: '라이브·콘텐츠',
    summary: '설명회·라이브 세션과 AI Tip 영상으로 최신 실무 인사이트를 제공합니다.',
    bullets: [
      '실무 활용 라이브·설명회',
      'AI Tip 숏폼 콘텐츠',
      '교재·도서 연계 학습 자료',
    ],
    href: '/live',
    cta: '라이브·콘텐츠 보기',
  },
];

const process = [
  { num: '01', icon: ClipboardCheck, label: '진단·상담', desc: '목표·현황 파악, 무료 상담으로 적합한 경로 안내' },
  { num: '02', icon: GraduationCap, label: '학습·설계', desc: '교육 수강·커리큘럼 구성·도입 설계 병행' },
  { num: '03', icon: Workflow, label: '실행·적용', desc: '현장 적용·자동화·실습 프로젝트로 성과 연결' },
  { num: '04', icon: Sparkles, label: '성과·자격', desc: '성과 점검·필요 시 자격·시험 경로 연계' },
];

export default function ServicesPage() {
  return (
    <div>
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush className="text-center">
          <p className="text-sm font-semibold mb-2 text-brand-orange">핵심 서비스</p>
          <h1 className="text-4xl font-extrabold mb-4 text-brand-blue">
            AI를 배우는 것을 넘어,<br className="hidden md:block" />
            <span className="text-brand-orange">업무 성과</span>로 연결합니다
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            기업 교육·개인 실무 교육·AI 컨설팅·라이브 콘텐츠 — 필요한 경로를 골라 시작하세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact">
              <BrandButton variant="primary" size="lg">
                무료 상담 신청 <ArrowRight className="w-4 h-4" />
              </BrandButton>
            </Link>
            <Link href="/courses">
              <BrandButton variant="outline" size="lg">
                교육과정 보기
              </BrandButton>
            </Link>
          </div>
        </PageShell>
      </section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">4가지 핵심 서비스</h2>
            <p className="text-muted-foreground">
              조직과 개인의 단계에 맞는 학습·실행·성과 경로를 제공합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <BrandCard
                  key={service.title}
                  accent={service.accent}
                  padding="lg"
                  className="flex flex-col h-full"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${service.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${service.iconColor}`} />
                  </div>
                  <BrandCardTitle className="text-lg mb-2">{service.title}</BrandCardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {service.summary}
                  </p>
                  <ul className="space-y-1.5 mb-6 text-sm text-foreground">
                    {service.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Link href={service.href}>
                      <BrandButton variant="outline" size="md">
                        {service.cta} <ArrowRight className="w-4 h-4" />
                      </BrandButton>
                    </Link>
                  </div>
                </BrandCard>
              );
            })}
          </div>
        </PageShell>
      </Section>

      <Section spacing="lg" className="bg-muted/30">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">진행 프로세스</h2>
            <p className="text-muted-foreground">
              진단·학습·실행·성과까지 4단계로 이어집니다
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div
              className="hidden md:block absolute h-px opacity-30"
              style={{
                top: '36px',
                left: '12.5%',
                right: '12.5%',
                background:
                  'linear-gradient(90deg, var(--brand-blue), var(--brand-sky), var(--brand-green), var(--brand-orange))',
              }}
            />
            {process.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="text-center relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border border-border shadow-sm">
                    <Icon className="w-7 h-7 text-brand-blue" />
                  </div>
                  <p className="text-xs font-bold mb-1 text-brand-sky">{step.num}</p>
                  <h4 className="font-bold text-foreground mb-1">{step.label}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </PageShell>
      </Section>

      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">서비스 도입을 검토 중이신가요?</h2>
          <p className="text-white/85 mb-8">
            업무 목표와 규모를 알려주시면 맞춤 커리큘럼·도입 일정을 안내해 드립니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact">
              <BrandButton size="lg" className="min-h-11 shadow-lg">
                무료 상담 신청 <ArrowRight className="w-4 h-4" />
              </BrandButton>
            </Link>
            <Link href="/courses">
              <BrandButton
                size="lg"
                variant="outline"
                className="min-h-11 border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white focus-visible:ring-white"
              >
                교육과정 보기
              </BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
