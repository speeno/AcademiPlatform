import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Video } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';
import { HeroBanner } from '@/components/hero/HeroBanner';
import { API_BASE } from '@/lib/api-base';
import { MainShortsSection } from '@/components/shorts/MainShortsSection';
import { BUSY_MODERN_MARKETING_COPY } from '@/lib/marketing-copy';

export const metadata: Metadata = {
  title: 'AcademiQ — 실무 AI 교육·컨설팅',
  description:
    '기업·개인을 위한 실무형 AI 교육, 컨설팅, 업무 자동화. 학습부터 현장 적용·자격 경로까지 AcademiQ에서 시작하세요.',
};

const features = [
  {
    iconSrc: '/icons/icon-edu.svg',
    title: '실무 중심 교육',
    desc: '직무·업종에 맞춘 AI 커리큘럼. 영상·PDF·라이브 강의로 배운 내용을 현장에 바로 적용합니다.',
    accent: 'none' as const,
  },
  {
    iconSrc: '/icons/icon-cert.svg',
    title: 'ISO/IEC 17024 공신력 경로',
    desc: '국제 표준 기반 자격·시험 접수. 실무 교육과 병행해 선택할 수 있는 공신력 경로입니다.',
    accent: 'green' as const,
  },
  {
    iconSrc: '/icons/icon-video.svg',
    title: '성과와 자동화',
    desc: '업무 프로세스 개선·자동화 설계를 함께 다룹니다. 생산성 향상을 목표로 학습과 실행을 연결합니다.',
    accent: 'none' as const,
  },
];

const coreServices = [
  {
    title: '기업 교육',
    desc: '직무별 맞춤 커리큘럼과 B2B 운영. 팀 단위 실무 역량을 빠르게 올립니다.',
    href: '/services/corporate',
    accent: 'blue' as const,
  },
  {
    title: '개인·실무 교육',
    desc: '온라인·라이브 강의로 AI 활용 역량을 키우고, 업무에 바로 적용합니다.',
    href: '/courses',
    accent: 'orange' as const,
  },
  {
    title: 'AI 컨설팅·도입',
    desc: '진단·설계·실행까지. 조직에 맞는 AI 도입과 업무 자동화를 지원합니다.',
    href: '/services/consulting',
    accent: 'sky' as const,
  },
  {
    title: '라이브·콘텐츠',
    desc: '설명회·라이브 세션과 AI Tip 영상으로 최신 실무 인사이트를 제공합니다.',
    href: '/live',
    accent: 'green' as const,
  },
  {
    title: 'AI 홈페이지',
    desc: 'AI 기반 홈페이지 제작·운영 상담. 브랜드에 맞는 웹사이트를 설계합니다.',
    href: '/services/ai-website',
    accent: 'blue' as const,
  },
  {
    title: '영상 제작 상담',
    desc: '홍보·교육·마케팅 영상 기획부터 제작까지, 목적에 맞는 영상을 상담합니다.',
    href: '/services/video-production',
    accent: 'orange' as const,
  },
];

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
      '네. 교육과정 페이지에서 원하는 과정을 선택해 수강 신청하실 수 있습니다. 유료 과정은 결제 후 바로 학습을 시작합니다.',
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
    const [galleryRes, displayRes] = await Promise.all([
      fetch(`${API_BASE}/settings/public/shorts_gallery`, { next: { revalidate: 30 } }),
      fetch(`${API_BASE}/settings/public/shorts_display`, { next: { revalidate: 30 } }),
    ]);
    let items: any[] = [];
    let display = { showOnMain: true, mainMaxItems: 6 };
    if (galleryRes.ok) {
      const g = await galleryRes.json().catch(() => ({}));
      items = Array.isArray(g?.value) ? g.value.filter((v: any) => v?.isActive !== false) : [];
    }
    if (displayRes.ok) {
      const d = await displayRes.json().catch(() => ({}));
      if (d?.value && typeof d.value === 'object') {
        display = { ...display, ...d.value };
      } else if (typeof d?.value === 'string') {
        try {
          display = { ...display, ...JSON.parse(d.value) };
        } catch {}
      }
    }
    return { items, display };
  } catch {
    return { items: [], display: { showOnMain: true, mainMaxItems: 6 } };
  }
}

export default async function HomePage() {
  const { items: shortsItems, display: shortsDisplay } = await getShortsData();

  return (
    <div>
      <HeroBanner />

      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-brand-orange">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue">왜 AcademiQ인가요?</h2>
            <p className="text-muted-foreground">실무 교육·컨설팅·자동화를 한곳에서, 성과까지 이어지는 플랫폼</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <BrandCard key={f.title} accent={f.accent} padding="lg">
                <div className="mb-4">
                  <Image src={f.iconSrc} alt={f.title} width={56} height={56} className="object-contain" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </BrandCard>
            ))}
          </div>

          <BrandCard accent="orange" padding="lg" className="mt-8">
            <p className="text-sm font-semibold text-brand-orange mb-2">{BUSY_MODERN_MARKETING_COPY.eyebrow}</p>
            <h3 className="text-2xl font-extrabold text-brand-blue mb-3">
              {BUSY_MODERN_MARKETING_COPY.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {BUSY_MODERN_MARKETING_COPY.description}
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {BUSY_MODERN_MARKETING_COPY.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </BrandCard>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-blue">핵심 서비스</h2>
              <p className="text-caption mt-1">
                기업·개인·컨설팅·콘텐츠 — 필요한 경로를 바로 선택하세요
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
            {coreServices.map((service) => (
              <Link key={service.title} href={service.href} className="block h-full">
                <BrandCard
                  accent={service.accent}
                  padding="lg"
                  className="h-full flex flex-col transition-shadow hover:shadow-md"
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
        </div>
      </section>

      {shortsDisplay.showOnMain && shortsItems.length > 0 && (
        <section className="py-16 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          </div>
        </section>
      )}

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                background: 'linear-gradient(90deg, #1A3F9C, #1A9AC5, #5AB85C, #F5A023)',
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
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
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
          <p className="text-white/80 mb-8">실무 AI 교육·컨설팅, AcademiQ와 함께 업무 성과로 연결하세요</p>
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
