import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Paperclip } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

type NoticeAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

type NoticeDetail = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishedAt?: string | null;
  attachments?: NoticeAttachment[];
};

async function getNotice(id: string) {
  try {
    const res = await fetch(`${API}/notices/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NoticeDetail;
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
        <PageShell size="content" flush>
          <Link href="/notices">
            <BrandButton variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              목록으로
            </BrandButton>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">{notice.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </div>
        </PageShell>
      </section>

      <section className="py-10">
        <PageShell size="content" flush>
          <div className="bg-white rounded-xl border p-6 md:p-8">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: notice.content ?? '' }}
            />

            {(notice.attachments?.length ?? 0) > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-sm font-semibold text-foreground mb-3">첨부파일</h2>
                <ul className="space-y-2">
                  {notice.attachments?.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={`${API}/notices/${notice.id}/attachments/${attachment.id}/download`}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/30"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{attachment.fileName}</span>
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link href="/notices">
              <BrandButton variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                목록으로 돌아가기
              </BrandButton>
            </Link>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
