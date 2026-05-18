import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Building2,
  Users,
  Target,
  LineChart,
  CalendarClock,
  ClipboardCheck,
  Award,
  Handshake,
} from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { Section } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: '기업 교육',
  description:
    '직무·업종별 맞춤 AI 실무 교육으로 팀 단위 역량을 빠르게 끌어올립니다. 진단부터 운영·성과 점검까지 AcademiQ가 함께합니다.',
};

const valueProps = [
  {
    icon: Target,
    accent: 'blue' as const,
    title: '직무 맞춤 커리큘럼',
    desc: '신입·실무자·리더 단계별, 직무·업종 특성을 반영한 맞춤형 교육과정으로 설계합니다.',
  },
  {
    icon: Users,
    accent: 'orange' as const,
    title: '팀 단위 운영',
    desc: '집합·온라인·블렌디드 운영 옵션을 자유롭게 조합해 조직 일정에 맞춰 진행합니다.',
  },
  {
    icon: LineChart,
    accent: 'sky' as const,
    title: '성과 점검 리포트',
    desc: '교육 종료 후 학습 결과·실무 적용 현황을 분석한 리포트로 도입 효과를 확인합니다.',
  },
  {
    icon: Award,
    accent: 'green' as const,
    title: '자격·인증 연계',
    desc: '필요 시 ISO/IEC 17024 기반 자격 경로와 연결해 객관적 역량 인증까지 이어갑니다.',
  },
];

const programs = [
  {
    title: 'AI 리터러시',
    desc: '전사 임직원을 위한 AI 기본 이해·생산성 도구 활용. 4~8시간 단기 과정.',
    audience: '전 직원',
  },
  {
    title: '실무 활용 워크숍',
    desc: '직무별 시나리오 기반 프롬프트·자동화 워크숍. 8~16시간 집중 과정.',
    audience: '실무자',
  },
  {
    title: 'AI 리더십·전략',
    desc: '경영진·관리자 대상 AI 도입 전략·의사결정 프레임워크. 4~12시간 과정.',
    audience: '리더·임원',
  },
  {
    title: '맞춤 도입 프로젝트',
    desc: '특정 업무 자동화·콘텐츠 제작 등 실제 산출물 기반 프로젝트형 교육.',
    audience: '특정 팀',
  },
];

const process = [
  { num: '01', icon: Handshake, label: '진단·상담', desc: '교육 목표·대상·예산·일정 등 요건 파악' },
  { num: '02', icon: ClipboardCheck, label: '커리큘럼 설계', desc: '대상별 학습 목표·콘텐츠·실습 시나리오 구성' },
  { num: '03', icon: CalendarClock, label: '운영', desc: '집합·온라인·블렌디드 운영, 강사진·교재 제공' },
  { num: '04', icon: LineChart, label: '성과 점검', desc: '학습·만족도·실무 적용 리포트, 후속 과정 제안' },
];

export default function CorporateServicePage() {
  return (
    <div>
      <section className="bg-hero-gradient py-16 border-b">
        <PageShell flush>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <p className="text-sm font-semibold mb-2 text-brand-orange">기업 교육</p>
              <h1 className="text-4xl font-extrabold mb-4 text-brand-blue leading-tight">
                팀 단위로 시작하는<br />
                <span className="text-brand-orange">실무형 AI 교육</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                직무·업종·역할에 맞춘 커리큘럼으로 임직원의 AI 활용 역량을 빠르게 끌어올리고,
                실제 업무 성과로 연결합니다.
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
                <Building2 className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">기업 교육의 차별점</h2>
            <p className="text-muted-foreground">
              조직 특성과 운영 환경을 반영해, 학습이 곧 업무 성과로 이어집니다
            </p>
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
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">프로그램 라인업</h2>
            <p className="text-muted-foreground">
              대상·목적에 따라 선택하거나 조합할 수 있습니다
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((p) => (
              <BrandCard key={p.title} accent="blue" padding="lg">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <BrandCardTitle className="text-lg">{p.title}</BrandCardTitle>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-blue-subtle text-brand-blue shrink-0">
                    {p.audience}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </BrandCard>
            ))}
          </div>
        </PageShell>
      </Section>

      <Section spacing="lg" className="bg-white">
        <PageShell flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">진행 프로세스</h2>
            <p className="text-muted-foreground">상담부터 성과 점검까지 한 흐름으로 진행합니다</p>
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
            {process.map(({ num, icon: Icon, label, desc }) => (
              <div key={num} className="text-center relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border border-border shadow-sm">
                  <Icon className="w-7 h-7 text-brand-blue" />
                </div>
                <p className="text-xs font-bold mb-1 text-brand-sky">{num}</p>
                <h4 className="font-bold text-foreground mb-1">{label}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </Section>

      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">팀 교육 도입을 검토 중이신가요?</h2>
          <p className="text-white/85 mb-8">
            조직 목표와 일정을 알려주시면 최적의 커리큘럼·운영안을 제안해 드립니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact">
              <BrandButton size="lg" className="min-h-11 shadow-lg">
                무료 상담 신청 <ArrowRight className="w-4 h-4" />
              </BrandButton>
            </Link>
            <Link href="/services/consulting">
              <BrandButton
                size="lg"
                variant="outline"
                className="min-h-11 border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white focus-visible:ring-white"
              >
                AI 컨설팅 보기
              </BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
