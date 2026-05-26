import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, FileText } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PriceDisplay } from '@/components/ui/price-display';
import { PageShell } from '@/components/layout/PageShell';
import { PublicAuthRefresh } from '@/components/auth/PublicAuthRefresh';
import { TextbookPurchaseButton } from '@/components/store/TextbookPurchaseButton';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { getServerApiBase } from '@/lib/api-base';
import {
  ONLINE_TEXTBOOK_STORE_AVAILABLE,
  ONLINE_TEXTBOOK_UNAVAILABLE_LABEL,
} from '@/lib/online-textbook-store';

interface StoreTextbookDetail {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  totalPages?: number | null;
  price: number | null;
  displayFee: number | null;
  hasAccess?: boolean;
}

async function getTextbookDetail(id: string): Promise<StoreTextbookDetail | null> {
  try {
    const res = await fetchWithTimeout(
      `${getServerApiBase()}/textbooks/${id}/public`,
      { next: { revalidate: 30 } },
      8000,
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getTextbookDetail(id);
  if (!book) return { title: '교재를 찾을 수 없습니다' };
  return {
    title: book.title,
    description: book.description ?? `${book.title} — AcademiQ 온라인 교재`,
  };
}

export default async function TextbookStoreDetailPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getTextbookDetail(id);
  if (!book) notFound();

  const ctaPrice = book.displayFee ?? book.price ?? null;

  return (
    <>
      <PublicAuthRefresh />
      <section className="bg-hero-gradient border-b border-border py-10">
        <PageShell flush>
          <Link
            href="/store/textbooks"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-blue mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            교재 스토어로 돌아가기
          </Link>
          <p className="text-sm font-semibold mb-2 text-brand-orange">온라인 교재</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-blue line-clamp-3">
            {book.title}
          </h1>
        </PageShell>
      </section>

      <section className="py-10 bg-white">
        <PageShell flush>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-xl border overflow-hidden bg-muted aspect-[3/4] relative flex items-center justify-center">
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : (
                <FileText className="w-16 h-16 text-muted-foreground" />
              )}
            </div>

            <BrandCard accent="sky" padding="lg" className="flex flex-col min-w-0">
              {book.description && (
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                  {book.description}
                </p>
              )}
              {book.totalPages != null && book.totalPages > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  총 {book.totalPages.toLocaleString('ko-KR')}페이지
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-2">
                {ONLINE_TEXTBOOK_STORE_AVAILABLE
                  ? '결제 후 즉시 온라인 열람'
                  : `온라인 교재 구매·열람은 현재 ${ONLINE_TEXTBOOK_UNAVAILABLE_LABEL}입니다.`}
              </p>
              <PriceDisplay
                price={ctaPrice}
                className="text-2xl font-extrabold text-brand-orange mb-6"
              />
              <div className="mt-auto space-y-3">
                <TextbookPurchaseButton
                  textbookId={book.id}
                  title={book.title}
                  displayFee={book.displayFee}
                  hasAccess={book.hasAccess}
                />
                <Link href="/store/textbooks?tab=external">
                  <BrandButton variant="outline" size="sm" fullWidth>
                    외부 판매처 교재 보기
                  </BrandButton>
                </Link>
              </div>
            </BrandCard>
          </div>
        </PageShell>
      </section>
    </>
  );
}
