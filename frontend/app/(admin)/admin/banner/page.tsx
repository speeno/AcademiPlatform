'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, ImageIcon } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiFetchWithAuth } from '@/lib/api-client';
import { toast } from 'sonner';
import { TEMPLATE_HERO_SLIDES, type HeroSlide } from '@/components/hero/HeroBanner';
import { BannerSlideEditor } from './BannerSlideEditor';

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
    apiFetchWithAuth('/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (!data.hero_banner) { setSlides(TEMPLATE_HERO_SLIDES.map((s) => ({ ...s }))); return; }
        try {
          const parsed = JSON.parse(data.hero_banner);
          setSlides(parsed?.slides?.length
            ? parsed.slides.map((s: Partial<HeroSlide>, i: number) => normalizeSlide(s, i))
            : TEMPLATE_HERO_SLIDES.map((s) => ({ ...s })));
        } catch { setSlides(TEMPLATE_HERO_SLIDES.map((s) => ({ ...s }))); }
      })
      .catch(() => toast.error('설정 로드 실패'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetchWithAuth('/admin/settings/hero_banner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify({ slides }) }),
      });
      if (!res.ok) throw new Error('저장 실패');
      toast.success('히어로 배너가 저장되었습니다.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally { setSaving(false); }
  };

  const updateSlide = (idx: number, patch: Partial<HeroSlide>) =>
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) { toast.error('최소 1개의 슬라이드가 필요합니다.'); return; }
    setSlides((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => { const next = [...prev]; [next[idx], next[target]] = [next[target], next[idx]]; return next; });
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="히어로 배너 관리"
        description="메인 페이지 상단 배너의 슬라이드를 관리합니다"
        eyebrow="사이트 관리"
        actions={
          <>
            <BrandButton variant="secondary" onClick={() => setSlides((p) => [...p, newSlide()])}>
              <Plus className="w-4 h-4" /> 슬라이드 추가
            </BrandButton>
            <BrandButton variant="primary" onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" /> 저장
            </BrandButton>
          </>
        }
      />

      {slides.map((slide, idx) => (
        <BannerSlideEditor
          key={slide.id}
          slide={slide}
          idx={idx}
          totalCount={slides.length}
          isPreview={previewIdx === idx}
          onUpdate={updateSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
          onTogglePreview={(i) => setPreviewIdx((prev) => (prev === i ? null : i))}
        />
      ))}

      {slides.length === 0 && (
        <BrandCard padding="lg" className="text-center py-16">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">등록된 슬라이드가 없습니다</p>
          <BrandButton variant="secondary" onClick={() => setSlides([newSlide()])}>
            <Plus className="w-4 h-4" /> 첫 슬라이드 만들기
          </BrandButton>
        </BrandCard>
      )}
    </div>
  );
}
