import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Video } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import type { Metadata } from 'next';
import { HeroBanner } from '@/components/hero/HeroBanner';
import { API_BASE } from '@/lib/api-base';
import { MainShortsSection } from '@/components/shorts/MainShortsSection';

export const metadata: Metadata = {
  title: 'AcademiQ — Learn. Certify. Succeed.',
  description: 'ISO/IEC 17024 기반 AI 자격 교육과 시험 접수를 한 곳에서. 지금 시작하세요.',
};

const features = [
  {
    iconSrc: '/icons/icon-edu.svg',
    title: '체계적인 교육과정',
    desc: 'AI 자격 취득을 위한 체계적인 커리큘럼. 영상·PDF·라이브 강의를 통합 제공합니다.',
  },
  {
    iconSrc: '/icons/icon-cert.svg',
    title: 'ISO/IEC 17024 국제자격',
    desc: '국제 표준 ISO/IEC 17024 기반의 공신력 있는 AI 분야 개인 자격증을 취득하세요.',
  },
  {
    iconSrc: '/icons/icon-video.svg',
    title: '온라인 시험 접수',
    desc: '복잡한 시험 접수 절차를 온라인으로 간편하게. 수강부터 접수까지 한 계정으로.',
  },
];

const steps = [
  { num: '01', iconSrc: '/icons/icon-edu.svg', label: '소개 확인', desc: '자격 개요 및 취득 이점 확인' },
  { num: '02', iconSrc: '/icons/icon-users.svg', label: '수강 신청', desc: '교육과정 선택 및 결제' },
  { num: '03', iconSrc: '/icons/icon-video.svg', label: '강의 수강', desc: '영상·PDF·라이브 학습' },
  { num: '04', iconSrc: '/icons/icon-cert.svg', label: '시험 접수', desc: '온라인으로 간편 접수·결제' },
];

const stats = [
  { value: '2,400+', label: '2026년 목표 수강생' },
  { value: '94%', label: '2026년 목표 자격 취득률' },
  { value: '12개', label: '2026년 목표 자격 종류' },
  { value: '4.9', label: '2026년 목표 수강 만족도' },
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
        try { display = { ...display, ...JSON.parse(d.value) }; } catch {}
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
      {/* Hero 배너 (관리자 설정 가능) */}
      <HeroBanner />

      {/* 통계 섹션 */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-brand-orange" >{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue" >
              왜 AcademiQ인가요?
            </h2>
            <p className="text-muted-foreground">교육부터 자격 취득까지 완성되는 플랫폼</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <BrandCard key={f.title} hoverable padding="lg">
                <div className="mb-4">
                  <Image src={f.iconSrc} alt={f.title} width={56} height={56} className="object-contain" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </BrandCard>
            ))}
          </div>
        </div>
      </section>

      {/* 홍보영상 캐러셀 */}
      {shortsDisplay.showOnMain && shortsItems.length > 0 && (
        <section className="py-16 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-blue-subtle"
                >
                  <Video className="w-5 h-5 text-brand-blue"  />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">AI Tip 영상</h2>
                  <p className="text-sm text-muted-foreground">AI 활용 팁 영상을 확인하세요</p>
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

      {/* 수강 절차 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3 text-brand-blue" >
              이렇게 시작하세요
            </h2>
            <p className="text-muted-foreground">4단계로 완성되는 자격 취득 여정</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* 연결선 */}
            <div
              className="hidden md:block absolute h-px opacity-30"
              style={{ top: '36px', left: '12.5%', right: '12.5%', background: 'linear-gradient(90deg, #1A3F9C, #1A9AC5, #5AB85C, #F5A023)' }}
            />
            {steps.map((step) => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Image src={step.iconSrc} alt={step.label} width={56} height={56} className="object-contain drop-shadow-md" />
                </div>
                <p className="text-xs font-bold mb-1 text-brand-sky" >{step.num}</p>
                <h4 className="font-bold text-foreground mb-1">{step.label}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 bg-banner-gradient relative overflow-hidden">
        {/* 브랜드 웨이브 장식 */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,80 C300,20 600,140 900,80 C1100,40 1150,100 1200,80 L1200,200 L0,200 Z" fill="white" />
        </svg>
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-3">지금 바로 시작하세요</h2>
          <p className="text-white/80 mb-8">AI 자격 취득의 첫 걸음, AcademiQ와 함께</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/courses">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity bg-join-gradient"
              >
                JOIN NOW <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-white text-white font-bold text-base hover:bg-white/10 transition-colors">
                상담 문의
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
