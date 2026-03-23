import type { Metadata } from 'next';
import { Pin, Bell } from 'lucide-react';
import { BrandBadge } from '@/components/ui/brand-badge';

export const metadata: Metadata = {
  title: '공지사항',
  description: 'AcademiQ 공지사항을 확인하세요.',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

async function getNotices(page = 1) {
  try {
    const res = await fetch(`${API}/admin/notices?page=${page}&limit=20`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { notices: [], total: 0 };
    return res.json();
  } catch {
    return { notices: [], total: 0 };
  }
}

const sampleNotices = [
  { id: '1', title: '[필독] 2026년 AI 자격시험 일정 안내', isPinned: true, isPublished: true, publishedAt: '2026-03-01T00:00:00Z', scopeType: 'ALL' },
  { id: '2', title: '사이트 정기 점검 안내 (3/20 새벽 2~4시)', isPinned: true, isPublished: true, publishedAt: '2026-03-10T00:00:00Z', scopeType: 'ALL' },
  { id: '3', title: '1분기 신규 교육과정 오픈 안내', isPinned: false, isPublished: true, publishedAt: '2026-03-05T00:00:00Z', scopeType: 'ALL' },
  { id: '4', title: '수강신청 방법 및 환불 정책 안내', isPinned: false, isPublished: true, publishedAt: '2026-02-20T00:00:00Z', scopeType: 'ALL' },
];

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const { notices } = await getNotices(page);
  const list = notices.length > 0 ? notices : sampleNotices;

  const pinned = list.filter((n: any) => n.isPinned);
  const normal = list.filter((n: any) => !n.isPinned);

  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--brand-blue)' }}>공지사항</h1>
          <p className="text-gray-600">AcademiQ의 중요 공지 및 소식을 확인하세요.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* 고정 공지 */}
          {pinned.length > 0 && (
            <div className="mb-6 space-y-2">
              {pinned.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
                  <Pin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-blue)' }} />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{n.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ko-KR') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 일반 공지 */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {normal.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-3" />
                <p>공지사항이 없습니다.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {normal.map((n: any, idx: number) => (
                  <li key={n.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="text-sm text-gray-300 w-8 text-right flex-shrink-0">{idx + 1}</span>
                    <span className="flex-1 text-sm text-gray-800 font-medium">{n.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <BrandBadge variant="default" className="text-xs">공지</BrandBadge>
                      <span className="text-xs text-gray-400">
                        {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ko-KR') : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
