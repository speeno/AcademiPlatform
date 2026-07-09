import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Video } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';
import { HeroBanner, type HeroBannerData } from '@/components/hero/HeroBanner';
import { MainShortsSection } from '@/components/shorts/MainShortsSection';
import { MarketingHighlight } from '@/components/marketing/MarketingHighlight';
import { PublicScheduleWidget } from '@/components/training/PublicScheduleWidget';
import { PageShell } from '@/components/layout/PageShell';
import { fetchPublicSettings } from '@/lib/public-settings';
import { coreServiceCards } from '@/lib/core-services';

export const metadata: Metadata = {
  title: 'AcademiQ — 실무 AI 교육·컨설팅',
  description:
    '기업·개인을 위한 실무형 AI 교육, 컨설팅, 업무 자동화. 학습부터 현장 적용·자격 경로까지 AcademiQ에서 시작하세요.',
};

const steps = [
  { num: '01', iconSrc: '/icons/icon-edu.svg', label: '진단·상담', desc: '목표·현황 파악 및 맞춤 경로 안내' },
  { num: '02', iconSrc: '/icons/icon-users.svg', label: '학습·설계', desc: '교육 수강·커리큘럼·도입 설계' },
  { num: '03', iconSrc: '/icons/icon-video.svg', label: '실행·적용', desc: '현장 적용·자동화·실습 프로젝트' },
  { num: '04', iconSrc: '/icons/icon-cert.svg', label: '성과·자격', desc: '성과 점검·필요 시 자격·시험 연계' },
];

const stats = [
  { value: '2,400+', label: '2026년 목표 수강생' },
  { value: '94%', label: '2026년 목표 자격 취득률' },
  { value: '12개', label: '2026년 목표 자격 종류' },
  { value: '4.9', label: '2026년 목표 수강 만족도' },
];

const homeFaqPreview = [
  {
    question: '기업 교육·컨설팅은 어떻게 신청하나요?',
    answer:
      '무료 상담 신청 페이지에서 목표와 규모를 알려주시면, 맞춤 커리큘럼·도입 일정을 안내해 드립니다.',
  },
  {
    question: '개인도 수강할 수 있나요?',
    answer:
      '네. 교육과정 페이지에서 원하는 과정을 선택해 수강 신청하실 수 있습니다. 신청 후 관리자 승인이 완료되면 학습을 시작합니다.',
  },
  {
    question: '자격증·시험은 필수인가요?',
    answer:
      '필수는 아닙니다. 실무 역량과 업무 성과가 우선이며, 필요 시 ISO/IEC 17024 기반 자격·시험 경로를 선택할 수 있습니다.',
  },
  {
    question: '환불 정책이 어떻게 되나요?',
    answer:
      '수강 시작 후 7일 이내 미수강 시 전액 환불 등 과정별 정책이 적용됩니다. 자세한 내용은 FAQ와 이용약관을 참고해 주세요.',
  },
];

async function getShortsData() {
  try {
    const values = await fetchPublicSettings(
      ['shorts_gallery', 'shorts_display', 'hero_banner'],
      30,
    );
    let items: any[] = [];
    let display = { showOnMain: true, mainMaxItems: 6 };
    if (Array.isArray(values.shorts_gallery)) {
      items = values.shorts_gallery.filter((v: any) => v?.isActive !== false);
    }
    if (values.shorts_display && typeof values.shorts_display === 'object') {
      display = { ...display, ...values.shorts_display };
    }
    const heroBanner: HeroBannerData | null =
      values.hero_banner && typeof values.hero_banner === 'object'
        ? (values.hero_banner as HeroBannerData)
        : null;
    return { items, display, heroBanner };
  } catch {
    return {
      items: [],
      display: { showOnMain: true, mainMaxItems: 6 },
      heroBanner: null,
    };
  }
}

export default async function HomePage() {
  const {
    items: shortsItems,
    display: shortsDisplay,
    heroBanner,
  } = await getShortsData();

  return (
    <div>
      <HeroBanner bannerValue={heroBanner} />

      <section className="border-y border-border bg-white">
        <PageShell size="wide" flush className="py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-white px-4 py-5 shadow-[0_8px_20px_rgba(4,43,92,0.05)]">
                <p className="text-3xl font-extrabold text-brand-blue">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      <MarketingHighlight />

      {/* AX 워크톤 소개 밴드 */}
      <section className="border-y border-border bg-brand-blue-subtle/40 py-16 md:py-20">
        <PageShell size="wide" flush>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 mx-auto w-full max-w-sm lg:order-1">
              <Image
                src="/promotion/ax-workthon-overview.jpg"
                alt="AX 워크톤 전체 안내 포스터"
                width={1055}
                height={1491}
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="h-auto w-full rounded-2xl border border-border shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="mb-2 text-sm font-semibold text-brand-orange">
                기업 AX 실전 교육 · Work-a-thon
              </p>
              <h2 className="text-3xl font-extrabold text-brand-blue md:text-4xl">
                AX 워크톤
              </h2>
              <p className="mt-2 text-lg font-bold text-brand-blue/90">
                이론은 짧게, 결과는 확실하게
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                내 업무를 가져와 AI 워크플로로 전환하는 실전 프로그램입니다.
                데이(1일)·스프린트(3일)·부트캠프(1주), 비개발자·개발자 트랙으로 팀의
                AI 자동화를 표준으로 정착시킵니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['데이 1일', '스프린트 3일', '부트캠프 1주'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-brand-blue/15 bg-white px-3 py-1 text-sm font-semibold text-brand-blue shadow-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-sm">
                <ShieldCheck className="h-4 w-4 text-brand-orange" />
                ISO 국제표준 기반 AI 자격 연계
              </div>
              <div className="mt-6">
                <Link href="/ax-workthon">
                  <BrandButton variant="primary" size="lg">
                    AX 워크톤 자세히 보기 <ArrowRight className="h-4 w-4" />
                  </BrandButton>
                </Link>
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      {/* 공개 교육 일정 미니 달력 — 게시된 강의 계획이 없으면 자동 숨김 */}
      <PublicScheduleWidget />

      <section className="py-16 md:py-20 bg-white">
        <PageShell size="wide" flush>
          <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-blue">핵심 서비스</h2>
              <p className="text-caption mt-1">
                기업·개인·자격증·Harness — 필요한 경로를 바로 선택하세요
              </p>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium hover:underline flex items-center gap-1 text-brand-blue shrink-0"
            >
              전체 서비스 보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {coreServiceCards.map((service) => (
              <Link key={service.title} href={service.href} className="block h-full">
                <BrandCard
                  accent={service.accent}
                  padding="lg"
                  className="h-full flex flex-col"
                >
                  <BrandCardTitle className="text-lg mb-2">{service.title}</BrandCardTitle>
                  <p className="flex-1 text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                  <p className="mt-4 text-sm font-semibold text-brand-blue inline-flex items-center gap-1">
                    자세히 보기 <ArrowRight className="w-3.5 h-3.5" />
                  </p>
                </BrandCard>
              </Link>
            ))}
          </div>
        </PageShell>
      </section>

      {shortsDisplay.showOnMain && shortsItems.length > 0 && (
        <section className="py-16 bg-white border-b">
          <PageShell size="wide" flush>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-blue-subtle">
                  <Video className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">실무 콘텐츠</h2>
                  <p className="text-sm text-muted-foreground">AI 활용 팁·라이브 하이라이트를 확인하세요</p>
                </div>
              </div>
              <Link
                href="/shorts"
                className="text-sm font-medium hover:underline flex items-center gap-1 text-brand-blue"
              >
                전체 보기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <MainShortsSection items={shortsItems} maxItems={shortsDisplay.mainMaxItems} autoPlay />
          </PageShell>
        </section>
      )}

      <section className="py-20 bg-white">
        <PageShell size="wide" flush>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">이렇게 시작하세요</h2>
            <p className="text-muted-foreground">진단부터 학습·실행·성과까지 4단계로 이어집니다</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div
              className="hidden md:block absolute h-px opacity-30"
              style={{
                top: '36px',
                left: '12.5%',
                right: '12.5%',
                background: 'linear-gradient(90deg, #073B78, #08A9A5, #58B947)',
              }}
            />
            {steps.map((step) => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Image
                    src={step.iconSrc}
                    alt={step.label}
                    width={56}
                    height={56}
                    className="object-contain drop-shadow-md"
                  />
                </div>
                <p className="text-xs font-bold mb-1 text-brand-sky">{step.num}</p>
                <h4 className="font-bold text-foreground mb-1">{step.label}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      <section className="py-16 md:py-20 bg-muted/30">
        <PageShell size="wide" flush>
          <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-blue">자주 묻는 질문</h2>
              <p className="text-caption mt-1">궁금한 점을 빠르게 확인하세요</p>
            </div>
            <Link
              href="/faq"
              className="text-sm font-medium hover:underline flex items-center gap-1 text-brand-blue shrink-0"
            >
              FAQ 전체 보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          <div className="space-y-2">
            {homeFaqPreview.map((faq) => (
              <details
                key={faq.question}
                className="bg-white border border-border rounded-xl group overflow-hidden shadow-sm"
              >
                <summary className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-muted/30 list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-foreground flex-1">{faq.question}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20">
                  <p className="pt-4">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </PageShell>
      </section>

      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C300,20 600,140 900,80 C1100,40 1150,100 1200,80 L1200,200 L0,200 Z"
            fill="white"
          />
        </svg>
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">지금 바로 시작하세요</h2>
          <p className="text-white/80 mb-8">
            교육 신청부터 시험 접수까지 하나의 플랫폼에서. ISO/IEC 17024 기반 AI 자격 교육을 체계적으로 준비하세요.
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
                자격증교육과정 보기
              </BrandButton>
            </Link>
            <Link href="/exam">
              <BrandButton
                size="lg"
                variant="outline"
                className="min-h-11 border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white focus-visible:ring-white"
              >
                자격증시험 온라인 접수
              </BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
