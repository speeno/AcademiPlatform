import {
  Trash2, Eye, EyeOff, GripVertical,
  ArrowRight, ChevronUp, ChevronDown, ImageIcon,
} from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import type { HeroSlide } from '@/components/hero/HeroBanner';

interface Props {
  slide: HeroSlide;
  idx: number;
  totalCount: number;
  isPreview: boolean;
  onUpdate: (idx: number, patch: Partial<HeroSlide>) => void;
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onTogglePreview: (idx: number) => void;
}

export function BannerSlideEditor({ slide, idx, totalCount, isPreview, onUpdate, onRemove, onMove, onTogglePreview }: Props) {
  return (
    <BrandCard padding="lg" className="relative">
      <div className="flex items-center gap-3 mb-4">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold text-muted-foreground">슬라이드 {idx + 1}</span>
        <button
          onClick={() => onUpdate(idx, { isActive: !slide.isActive })}
          className={`ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            slide.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
          }`}
        >
          {slide.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {slide.isActive ? '활성' : '비활성'}
        </button>
        <div className="ml-auto flex gap-1">
          <button onClick={() => onMove(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30" title="위로">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => onMove(idx, 1)} disabled={idx === totalCount - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30" title="아래로">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => onTogglePreview(idx)} className="p-1 hover:bg-muted rounded" title="미리보기">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onRemove(idx)} className="p-1 hover:bg-red-50 text-red-500 rounded" title="삭제">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">배경 이미지 URL</label>
            <Input value={slide.backgroundImage} onChange={(e) => onUpdate(idx, { backgroundImage: e.target.value })} placeholder="/images/hero-bg.webp 또는 https://..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">오버레이 투명도: {slide.overlayOpacity.toFixed(2)}</label>
            <input
              type="range" min="0" max="1" step="0.05" value={slide.overlayOpacity}
              onChange={(e) => onUpdate(idx, { overlayOpacity: parseFloat(e.target.value) })}
              className="w-full accent-brand-blue"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">뱃지 텍스트</label>
            <Input value={slide.badge} onChange={(e) => onUpdate(idx, { badge: e.target.value })} placeholder="ISO/IEC 17024 국제인증" />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">메인 타이틀 <span className="text-muted-foreground">(줄바꿈: \n, 강조: **텍스트**)</span></label>
            <textarea value={slide.title} onChange={(e) => onUpdate(idx, { title: e.target.value })} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">부제</label>
            <textarea value={slide.subtitle} onChange={(e) => onUpdate(idx, { subtitle: e.target.value })} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Primary 버튼</label>
          <div className="flex gap-2">
            <Input
              value={slide.primaryButton?.text ?? ''}
              onChange={(e) => onUpdate(idx, { primaryButton: e.target.value ? { text: e.target.value, href: slide.primaryButton?.href ?? '/' } : null })}
              placeholder="버튼 텍스트" className="flex-1"
            />
            <Input
              value={slide.primaryButton?.href ?? ''}
              onChange={(e) => onUpdate(idx, { primaryButton: slide.primaryButton ? { ...slide.primaryButton, href: e.target.value } : { text: '버튼', href: e.target.value } })}
              placeholder="/courses" className="flex-1"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Secondary 버튼 (선택)</label>
          <div className="flex gap-2">
            <Input
              value={slide.secondaryButton?.text ?? ''}
              onChange={(e) => onUpdate(idx, { secondaryButton: e.target.value ? { text: e.target.value, href: slide.secondaryButton?.href ?? '/' } : null })}
              placeholder="버튼 텍스트" className="flex-1"
            />
            <Input
              value={slide.secondaryButton?.href ?? ''}
              onChange={(e) => onUpdate(idx, { secondaryButton: slide.secondaryButton ? { ...slide.secondaryButton, href: e.target.value } : null })}
              placeholder="/exam" className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-muted-foreground">우측 홍보 카드</label>
          <button
            type="button"
            onClick={() => onUpdate(idx, { promoCard: slide.promoCard ? null : { image: '/covers/ai-iso-creator.png', title: '홍보 배너 제목', description: '홍보 문구를 입력하세요', href: '/courses', ctaText: '자세히 보기' } })}
            className={`text-xs px-2 py-1 rounded ${slide.promoCard ? 'bg-muted text-muted-foreground' : 'bg-brand-blue-subtle text-brand-blue'}`}
          >
            {slide.promoCard ? '비활성화' : '활성화'}
          </button>
        </div>
        {slide.promoCard && (
          <div className="grid md:grid-cols-2 gap-3">
            <Input value={slide.promoCard.image} onChange={(e) => onUpdate(idx, { promoCard: { ...slide.promoCard!, image: e.target.value } })} placeholder="/covers/ai-iso-creator.png" />
            <Input value={slide.promoCard.title} onChange={(e) => onUpdate(idx, { promoCard: { ...slide.promoCard!, title: e.target.value } })} placeholder="홍보 카드 제목" />
            <Input value={slide.promoCard.description} onChange={(e) => onUpdate(idx, { promoCard: { ...slide.promoCard!, description: e.target.value } })} placeholder="홍보 문구" className="md:col-span-2" />
            <Input value={slide.promoCard.href} onChange={(e) => onUpdate(idx, { promoCard: { ...slide.promoCard!, href: e.target.value } })} placeholder="/courses/ai-expert-1" />
            <Input value={slide.promoCard.ctaText} onChange={(e) => onUpdate(idx, { promoCard: { ...slide.promoCard!, ctaText: e.target.value } })} placeholder="자세히 보기" />
          </div>
        )}
      </div>

      {isPreview && (
        <div className="mt-4 rounded-xl overflow-hidden border border-border">
          <div className="relative min-h-[280px] flex items-center bg-cover bg-center" style={{ backgroundImage: `url(${slide.backgroundImage})` }}>
            <div className="absolute inset-0 bg-hero-overlay" style={{ opacity: slide.overlayOpacity }} />
            <div className="relative px-8 py-10 text-white max-w-xl">
              {slide.badge && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 bg-white/10 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  {slide.badge}
                </span>
              )}
              <h2 className="text-2xl font-extrabold leading-tight mb-3 whitespace-pre-line">{slide.title.replace(/\*\*/g, '')}</h2>
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
  );
}
