import type { Metadata } from 'next';
import { Video } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { ShortsGalleryClient } from './ShortsGalleryClient';

export const metadata: Metadata = {
  title: 'AI Tip 영상 | AcademiQ',
  description: 'AI 활용 팁 영상을 한눈에 확인하세요.',
};

async function getShortsItems() {
  try {
    const res = await fetch(`${API_BASE}/settings/public/shorts_gallery`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.value;
    if (!Array.isArray(list)) return [];
    return list.filter((item: any) => item?.isActive !== false);
  } catch {
    return [];
  }
}

export default async function ShortsPage() {
  const items = await getShortsItems();

  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border border-brand-blue text-brand-blue bg-brand-blue-subtle"
          >
            <Video className="w-3.5 h-3.5" />
            <span>AI Tip 영상</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            AI <span className="text-brand-blue" >Tip 영상</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI 활용 팁 영상을 확인하세요.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {items.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
              현재 등록된 영상이 없습니다.
            </div>
          ) : (
            <ShortsGalleryClient items={items} />
          )}
        </div>
      </section>
    </div>
  );
}
