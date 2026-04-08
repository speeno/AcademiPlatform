import type { Metadata } from 'next';
import { Video } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { ShortsGalleryClient } from './ShortsGalleryClient';

export const metadata: Metadata = {
  title: 'AI 교육 홍보영상 | AcademiQ',
  description: 'AcademiQ AI 교육 홍보 영상을 한눈에 확인하세요.',
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border"
            style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)', background: 'var(--brand-blue-subtle)' }}
          >
            <Video className="w-3.5 h-3.5" />
            <span>홍보영상</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            AI 교육 <span style={{ color: 'var(--brand-blue)' }}>홍보 영상</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI 자격증 교육과 관련된 다양한 홍보 영상을 확인하세요.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {items.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
              현재 등록된 홍보영상이 없습니다.
            </div>
          ) : (
            <ShortsGalleryClient items={items} />
          )}
        </div>
      </section>
    </div>
  );
}
