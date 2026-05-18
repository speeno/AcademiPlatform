'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';

export interface HeroSlide {
  id: string;
  backgroundImage: string;
  overlayOpacity: number;
  badge: string;
  title: string;
  subtitle: string;
  primaryButton: { text: string; href: string } | null;
  secondaryButton: { text: string; href: string } | null;
  promoCard: {
    image: string;
    title: string;
    description: string;
    href: string;
    ctaText: string;
  } | null;
  isActive: boolean;
}

interface HeroBannerData {
  slides: HeroSlide[];
}

function sanitizeHeroSlide(slide: HeroSlide): HeroSlide {
  const isCorporateConsultingSlide =
    !!slide.primaryButton &&
    slide.primaryButton.href === '/contact' &&
    slide.primaryButton.text.includes('도입');
  const isStarterPackageSlide =
    !!slide.primaryButton &&
    slide.primaryButton.href === '/textbooks' &&
    slide.primaryButton.text.includes('패키지');

  if (!isCorporateConsultingSlide && !isStarterPackageSlide) return slide;

  return {
    ...slide,
    secondaryButton: null,
  };
}

export const TEMPLATE_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    backgroundImage: '/images/promos/hero-promo-corporate.webp',
    overlayOpacity: 0.58,
    badge: '기업과 개인을 위한 실무형 AI 교육·컨설팅 플랫폼',
    title: 'AI를 배우는 것을 넘어,\n실제 **업무 성과**로\n연결하세요',
    subtitle:
      '실무 교육·AI 컨설팅·업무 자동화·자격 경로를 한 플랫폼에서.\n학습부터 현장 적용·성과 측정까지 이어지는 실무형 여정을 제공합니다.',
    primaryButton: { text: '무료 상담 신청', href: '/contact' },
    secondaryButton: { text: '교육과정 보기', href: '/courses' },
    promoCard: {
      image: '/images/promos/hero-promo-corporate.webp',
      title: '기업·개인 맞춤 실무 교육',
      description: '직무별 커리큘럼과 컨설팅으로 AI를 업무 성과로 연결합니다.',
      href: '/contact',
      ctaText: '상담 신청',
    },
    isActive: true,
  },
  {
    id: 'default-2',
    backgroundImage: '/images/promos/hero-promo-corporate.webp',
    overlayOpacity: 0.58,
    badge: '기업 맞춤 AI 실무 교육',
    title: '임직원 AI 역량,\n지금 **업그레이드**',
    subtitle: '직무별 커리큘럼 설계부터 교육 운영까지\n기업 전용 트랙으로 빠르게 도입하세요.',
    primaryButton: { text: '도입 상담하기', href: '/contact' },
    secondaryButton: null,
    promoCard: {
      image: '/images/promos/hero-promo-corporate.webp',
      title: '기업교육 B2B 프로그램',
      description: '현업 적용 중심의 팀 단위 실무 교육을 제공합니다.',
      href: '/contact',
      ctaText: '문의하기',
    },
    isActive: true,
  },
  {
    id: 'default-3',
    backgroundImage: '/images/promos/hero-promo-certification.webp',
    overlayOpacity: 0.62,
    badge: '공신력 있는 자격 경로 (ISO/IEC 17024)',
    title: '학습과 성과를\n**자격**으로\n증명하세요',
    subtitle:
      '실무 역량을 쌓은 뒤, 필요 시 ISO/IEC 17024 기반 AI 자격으로 공신력을 더할 수 있습니다.\n교육·시험 접수도 같은 플랫폼에서 이어집니다.',
    primaryButton: { text: '교육과정 보기', href: '/courses' },
    secondaryButton: { text: '시험 접수 바로가기', href: '/exam' },
    promoCard: {
      image: '/covers/ai-iso-creator.png',
      title: 'AI ISO Creator 과정',
      description: '실무 커리큘럼과 국제 자격 대비를 함께 준비할 수 있습니다.',
      href: '/courses/ai-expert-1',
      ctaText: '자세히 보기',
    },
    isActive: true,
  },
];

function normalizeSlide(input: Partial<HeroSlide>, idx: number): HeroSlide {
  const normalized = {
    id: input.id ?? `normalized-${idx}`,
    backgroundImage: input.backgroundImage ?? '/images/hero-bg.webp',
    overlayOpacity: typeof input.overlayOpacity === 'number' ? input.overlayOpacity : 0.7,
    badge: input.badge ?? '',
    title: input.title ?? 'AcademiQ',
    subtitle: input.subtitle ?? '',
    primaryButton: input.primaryButton ?? null,
    secondaryButton: input.secondaryButton ?? null,
    promoCard: input.promoCard ?? null,
    isActive: input.isActive ?? true,
  };

  return sanitizeHeroSlide(normalized);
}

function renderTitle(raw: string) {
  const lines = raw.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((p, j) => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return (
              <span key={j} className="text-brand-orange">
                {p.slice(2, -2)}
              </span>
            );
          }
          return <span key={j}>{p}</span>;
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>(TEMPLATE_HERO_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/settings/public/hero_banner`)
      .then((r) => r.json())
      .then((data) => {
        const banner = data?.value as HeroBannerData | null;
        if (banner?.slides?.length) {
          const active = banner.slides
            .map((s, idx) => normalizeSlide(s, idx))
            .filter((s) => s.isActive);
          if (active.length > 0) setSlides(active);
        }
      })
      .catch(() => {});
  }, []);

  const activeSlides = slides;
  const total = activeSlides.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + total) % total), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [total, next]);

  const slide = activeSlides[current];
  if (!slide) return null;

  return (
    <section className="relative overflow-hidden min-h-[380px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[560px] flex items-center">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${slide.backgroundImage})` }}
      />
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-hero-overlay"
        style={{ opacity: slide.overlayOpacity }}
      />

      {/* 콘텐츠 */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12 items-center">
          <div>
            {slide.badge && (
              <span className="inline-flex max-w-full items-center gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 bg-white/10 border border-white/20 text-white line-clamp-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                {slide.badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 sm:mb-4 md:mb-5 text-white drop-shadow-md">
              {renderTitle(slide.title)}
            </h1>
            {slide.subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-white/80 mb-5 sm:mb-6 md:mb-8 leading-relaxed whitespace-pre-line">
                {slide.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {slide.primaryButton && (
                <Link href={slide.primaryButton.href} className="w-full sm:w-auto">
                  <button className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-white font-bold text-sm sm:text-base shadow-lg hover:opacity-90 transition-opacity bg-join-gradient">
                    {slide.primaryButton.text} <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </Link>
              )}
              {slide.secondaryButton && (
                <Link href={slide.secondaryButton.href} className="w-full sm:w-auto">
                  <button className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border-2 border-white text-white font-bold text-sm sm:text-base hover:bg-white/10 transition-colors backdrop-blur-sm">
                    {slide.secondaryButton.text}
                  </button>
                </Link>
              )}
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-center">
            {slide.promoCard ? (
              <Link
                href={slide.promoCard.href}
                className="group block w-full max-w-[360px] rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:translate-y-[-2px] transition-transform"
              >
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.promoCard.image})` }}
                />
                <div className="p-5">
                  <p className="text-white text-xl font-extrabold leading-tight mb-2">
                    {slide.promoCard.title}
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    {slide.promoCard.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-white group-hover:text-brand-orange transition-colors">
                    {slide.promoCard.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="text-right">
                <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-2">AcademiQ</p>
                <p className="text-2xl font-bold text-white/90 italic">Learn · Certify · Succeed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 슬라이드 네비게이션 */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 도트 인디케이터 */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? 'bg-white w-7' : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`슬라이드 ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
