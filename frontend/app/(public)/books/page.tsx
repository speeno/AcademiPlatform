import Link from 'next/link';
import type { Metadata } from 'next';
import { ExternalLink, BookOpen } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PriceDisplay } from '@/components/ui/price-display';
import { API_BASE } from '@/lib/api-base';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const metadata: Metadata = {
  title: '주요 교재 구매',
  description: '주요 교재를 별도로 구매할 수 있는 링크를 안내합니다.',
};

interface BookOffer {
  id: string;
  code?: string;
  title: string;
  price: number;
  coverImageUrl?: string;
  purchaseUrl: string;
  isActive?: boolean;
}

async function getBookOffers(): Promise<BookOffer[]> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/settings/public/book_offers`,
      { next: { revalidate: 30 } },
      8000,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.value;
    if (!Array.isArray(list)) return [];
    return list.filter((item) => item?.isActive !== false);
  } catch {
    return [];
  }
}

export default async function BooksPage() {
  const standaloneBooks = await getBookOffers();
  return (
    <div>
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-orange)' }}>
            교재 별도 구매
          </p>
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>
            AcademiQ 주요 교재
          </h1>
          <p className="text-gray-600">
            강좌 수강과 별도로 교재를 소장하고 싶은 경우, 아래 링크를 통해 구매할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          {standaloneBooks.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
              현재 구매 가능한 교재가 없습니다.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {standaloneBooks.map((book) => (
            <BrandCard key={book.id} accent="sky" padding="none" className="overflow-hidden h-full flex flex-col">
              <div
                className="h-52 bg-gray-100 bg-center bg-cover flex items-center justify-center"
                style={{ backgroundImage: book.coverImageUrl ? `url(${book.coverImageUrl})` : undefined }}
              >
                <BookOpen className="w-10 h-10 text-white/80" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--brand-sky)' }}>
                  {book.code ?? '-'}
                </p>
                <BrandCardTitle className="text-sm line-clamp-2 mb-2">{book.title}</BrandCardTitle>
                <p className="text-xs text-gray-500 mb-4">(소장)</p>
                <div className="mt-auto space-y-3">
                  <PriceDisplay
                    price={book.price}
                    className="text-sm font-semibold"
                    style={{ color: 'var(--brand-orange)' }}
                  />
                  <Link href={book.purchaseUrl} target="_blank" rel="noopener noreferrer">
                    <BrandButton variant="primary" size="sm" fullWidth>
                      구매하기
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </BrandButton>
                  </Link>
                </div>
              </div>
            </BrandCard>
          ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
