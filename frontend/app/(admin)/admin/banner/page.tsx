'use client';

import { useEffect, useState } from 'react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { Input } from '@/components/ui/input';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, Eye, EyeOff, GripVertical,
  ArrowRight, ChevronUp, ChevronDown, ImageIcon,
} from 'lucide-react';
import { TEMPLATE_HERO_SLIDES, type HeroSlide } from '@/components/hero/HeroBanner';

function newSlide(): HeroSlide {
  return {
    id: `slide-${Date.now()}`,
    backgroundImage: '/images/hero-bg.webp',
    overlayOpacity: 0.7,
    badge: '',
    title: '타이틀을 입력하세요',
    subtitle: '부제를 입력하세요',
    primaryButton: { text: '버튼 텍스트', href: '/courses' },
    secondaryButton: null,
    promoCard: {
      image: '/covers/ai-iso-creator.png',
      title: '홍보 배너 제목',
      description: '홍보 문구를 입력하세요',
      href: '/courses',
      ctaText: '자세히 보기',
    },
    isActive: true,
  };
}

function normalizeSlide(input: Partial<HeroSlide>, idx: number): HeroSlide {
  return {
    id: input.id ?? `slide-${Date.now()}-${idx}`,
    backgroundImage: input.backgroundImage ?? '/images/hero-bg.webp',
    overlayOpacity: typeof input.overlayOpacity === 'number' ? input.overlayOpacity : 0.7,
    badge: input.badge ?? '',
    title: input.title ?? '타이틀을 입력하세요',
    subtitle: input.subtitle ?? '부제를 입력하세요',
    primaryButton: input.primaryButton ?? null,
    secondaryButton: input.secondaryButton ?? null,
    promoCard: input.promoCard ?? null,
    isActive: input.isActive ?? true,
  };
}

export default function AdminBannerPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
      headers: buildAuthHeader(false),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.hero_banner) {
          setSlides(TEMPLATE_HERO_SLIDES.map((s) => ({ ...s })));
          return;
        }
        if (data.hero_banner) {
          try {
            const parsed = JSON.parse(data.hero_banner);
            if (parsed?.slides?.length) {
              setSlides(parsed.slides.map((s: Partial<HeroSlide>, idx: number) => normalizeSlide(s, idx)));
            } else {
              setSlides(TEMPLATE_HERO_SLIDES.map((s) => ({ ...s })));
            }
          } catch {
            setSlides(TEMPLATE_HERO_SLIDES.map((s) => ({ ...s })));
          }
        }
      })
      .catch(() => toast.error('설정 로드 실패'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/hero_banner`,
        {
          method: 'PATCH',
          headers: buildAuthHeader(true),
          body: JSON.stringify({ value: JSON.stringify({ slides }) }),
        },
      );
      if (!res.ok) throw new Error('저장 실패');
      toast.success('히어로 배너가 저장되었습니다.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (idx: number, patch: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.error('최소 1개의 슬라이드가 필요합니다.');
      return;
    }
    setSlides((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>
            히어로 배너 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            메인 페이지 상단 배너의 슬라이드를 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <BrandButton variant="secondary" onClick={() => setSlides((p) => [...p, newSlide()])}>
            <Plus className="w-4 h-4" /> 슬라이드 추가
          </BrandButton>
          <BrandButton variant="primary" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> 저장
          </BrandButton>
        </div>
      </div>

      {/* 슬라이드 목록 */}
      {slides.map((slide, idx) => (
        <BrandCard key={slide.id} padding="lg" className="relative">
          <div className="flex items-center gap-3 mb-4">
            <GripVertical className="w-4 h-4 text-gray-300" />
            <span className="text-sm font-bold text-gray-600">슬라이드 {idx + 1}</span>
            <button
              onClick={() => updateSlide(idx, { isActive: !slide.isActive })}
              className={`ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                slide.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {slide.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {slide.isActive ? '활성' : '비활성'}
            </button>
            <div className="ml-auto flex gap-1">
              <button onClick={() => moveSlide(idx, -1)} className="p-1 hover:bg-gray-100 rounded" title="위로">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveSlide(idx, 1)} className="p-1 hover:bg-gray-100 rounded" title="아래로">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)}
                className="p-1 hover:bg-gray-100 rounded"
                title="미리보기"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button onClick={() => removeSlide(idx)} className="p-1 hover:bg-red-50 text-red-500 rounded" title="삭제">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* 좌측 컬럼 */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">배경 이미지 URL</label>
                <Input
                  value={slide.backgroundImage}
                  onChange={(e) => updateSlide(idx, { backgroundImage: e.target.value })}
                  placeholder="/images/hero-bg.webp 또는 https://..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  오버레이 투명도: {slide.overlayOpacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={slide.overlayOpacity}
                  onChange={(e) => updateSlide(idx, { overlayOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--brand-blue)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">뱃지 텍스트</label>
                <Input
                  value={slide.badge}
                  onChange={(e) => updateSlide(idx, { badge: e.target.value })}
                  placeholder="ISO/IEC 17024 국제인증"
                />
              </div>
            </div>

            {/* 우측 컬럼 */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  메인 타이틀 <span className="text-gray-400">(줄바꿈: \n, 강조: **텍스트**)</span>
                </label>
                <textarea
                  value={slide.title}
                  onChange={(e) => updateSlide(idx, { title: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">부제</label>
                <textarea
                  value={slide.subtitle}
                  onChange={(e) => updateSlide(idx, { subtitle: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 버튼 설정 */}
          <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">Primary 버튼</label>
              <div className="flex gap-2">
                <Input
                  value={slide.primaryButton?.text ?? ''}
                  onChange={(e) =>
                    updateSlide(idx, {
                      primaryButton: e.target.value
                        ? { text: e.target.value, href: slide.primaryButton?.href ?? '/' }
                        : null,
                    })
                  }
                  placeholder="버튼 텍스트"
                  className="flex-1"
                />
                <Input
                  value={slide.primaryButton?.href ?? ''}
                  onChange={(e) =>
                    updateSlide(idx, {
                      primaryButton: slide.primaryButton
                        ? { ...slide.primaryButton, href: e.target.value }
                        : { text: '버튼', href: e.target.value },
                    })
                  }
                  placeholder="/courses"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">Secondary 버튼 (선택)</label>
              <div className="flex gap-2">
                <Input
                  value={slide.secondaryButton?.text ?? ''}
                  onChange={(e) =>
                    updateSlide(idx, {
                      secondaryButton: e.target.value
                        ? { text: e.target.value, href: slide.secondaryButton?.href ?? '/' }
                        : null,
                    })
                  }
                  placeholder="버튼 텍스트"
                  className="flex-1"
                />
                <Input
                  value={slide.secondaryButton?.href ?? ''}
                  onChange={(e) =>
                    updateSlide(idx, {
                      secondaryButton: slide.secondaryButton
                        ? { ...slide.secondaryButton, href: e.target.value }
                        : null,
                    })
                  }
                  placeholder="/exam"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* 홍보 카드 설정 */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600">우측 홍보 카드</label>
              <button
                type="button"
                onClick={() =>
                  updateSlide(idx, {
                    promoCard: slide.promoCard
                      ? null
                      : {
                          image: '/covers/ai-iso-creator.png',
                          title: '홍보 배너 제목',
                          description: '홍보 문구를 입력하세요',
                          href: '/courses',
                          ctaText: '자세히 보기',
                        },
                  })
                }
                className={`text-xs px-2 py-1 rounded ${slide.promoCard ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}
              >
                {slide.promoCard ? '비활성화' : '활성화'}
              </button>
            </div>
            {slide.promoCard && (
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={slide.promoCard.image}
                  onChange={(e) =>
                    updateSlide(idx, {
                      promoCard: { ...slide.promoCard!, image: e.target.value },
                    })
                  }
                  placeholder="/covers/ai-iso-creator.png"
                />
                <Input
                  value={slide.promoCard.title}
                  onChange={(e) =>
                    updateSlide(idx, {
                      promoCard: { ...slide.promoCard!, title: e.target.value },
                    })
                  }
                  placeholder="홍보 카드 제목"
                />
                <Input
                  value={slide.promoCard.description}
                  onChange={(e) =>
                    updateSlide(idx, {
                      promoCard: { ...slide.promoCard!, description: e.target.value },
                    })
                  }
                  placeholder="홍보 문구"
                  className="md:col-span-2"
                />
                <Input
                  value={slide.promoCard.href}
                  onChange={(e) =>
                    updateSlide(idx, {
                      promoCard: { ...slide.promoCard!, href: e.target.value },
                    })
                  }
                  placeholder="/courses/ai-expert-1"
                />
                <Input
                  value={slide.promoCard.ctaText}
                  onChange={(e) =>
                    updateSlide(idx, {
                      promoCard: { ...slide.promoCard!, ctaText: e.target.value },
                    })
                  }
                  placeholder="자세히 보기"
                />
              </div>
            )}
          </div>

          {/* 미리보기 */}
          {previewIdx === idx && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
              <div
                className="relative min-h-[280px] flex items-center bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.backgroundImage})` }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#0A1A4A] via-[#0F2771] to-[#0A2A50]"
                  style={{ opacity: slide.overlayOpacity }}
                />
                <div className="relative px-8 py-10 text-white max-w-xl">
                  {slide.badge && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 bg-white/10 border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      {slide.badge}
                    </span>
                  )}
                  <h2 className="text-2xl font-extrabold leading-tight mb-3 whitespace-pre-line">
                    {slide.title.replace(/\*\*/g, '')}
                  </h2>
                  <p className="text-sm text-white/80 mb-4 whitespace-pre-line">{slide.subtitle}</p>
                  <div className="flex gap-2">
                    {slide.primaryButton && (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-white text-xs font-bold bg-join-gradient">
                        {slide.primaryButton.text} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                    {slide.secondaryButton && (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-white text-white text-xs font-bold">
                        {slide.secondaryButton.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </BrandCard>
      ))}

      {slides.length === 0 && (
        <BrandCard padding="lg" className="text-center py-16">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">등록된 슬라이드가 없습니다</p>
          <BrandButton variant="secondary" onClick={() => setSlides([newSlide()])}>
            <Plus className="w-4 h-4" /> 첫 슬라이드 만들기
          </BrandButton>
        </BrandCard>
      )}
    </div>
  );
}
