import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

async function getNotice(id: string) {
  try {
    const res = await fetch(`${API}/notices/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNotice(id);
  return {
    title: notice?.title ?? '공지사항',
    description: notice?.title ?? 'AcademiQ 공지사항',
  };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(id);

  if (!notice) notFound();

  const dateStr = notice.publishedAt
    ? new Date(notice.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/notices">
            <BrandButton variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              목록으로
            </BrandButton>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{notice.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl border p-6 md:p-8">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: notice.content ?? '' }}
            />
          </div>

          <div className="mt-8 text-center">
            <Link href="/notices">
              <BrandButton variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                목록으로 돌아가기
              </BrandButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
