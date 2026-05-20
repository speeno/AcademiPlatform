import Link from 'next/link';
import type { Metadata } from 'next';
import { BookOpen, ExternalLink, Library } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageShell } from '@/components/layout/PageShell';
import { PublicAuthRefresh } from '@/components/auth/PublicAuthRefresh';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { getServerApiBase } from '@/lib/api-base';
import { getServerAuthHeaders } from '@/lib/server-api-fetch';
import { TextbookStoreClient, type StoreTextbook, type BookOffer } from './TextbookStoreClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '교재 구매',
  description: 'AcademiQ 온라인 교재와 외부 판매처 교재를 한곳에서 확인하고 구매하세요.',
};

type StoreTab = 'online' | 'external';

async function getStoreTextbooks(): Promise<{ books: StoreTextbook[]; loadError: boolean }> {
  try {
    const res = await fetchWithTimeout(
      `${getServerApiBase()}/textbooks/store/public`,
      { next: { revalidate: 30 }, headers: await getServerAuthHeaders() },
      8000,
    );
    if (!res.ok) return { books: [], loadError: true };
    const data = await res.json();
    return { books: Array.isArray(data) ? (data as StoreTextbook[]) : [], loadError: false };
  } catch {
    return { books: [], loadError: true };
  }
}

async function getBookOffers(): Promise<{ offers: BookOffer[]; loadError: boolean }> {
  try {
    const res = await fetchWithTimeout(
      `${getServerApiBase()}/settings/public/book_offers`,
      { next: { revalidate: 30 }, headers: await getServerAuthHeaders() },
      8000,
    );
    if (!res.ok) return { offers: [], loadError: true };
    const data = await res.json();
    const list = data?.value;
    if (!Array.isArray(list)) return { offers: [], loadError: false };
    return {
      offers: list.filter((item: BookOffer) => item?.isActive !== false),
      loadError: false,
    };
  } catch {
    return { offers: [], loadError: true };
  }
}

interface PageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function TextbookStorePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const requested = params.tab === 'external' ? 'external' : 'online';
  const initialTab: StoreTab = requested;

  const [{ books, loadError: onlineError }, { offers, loadError: offerError }] = await Promise.all([
    getStoreTextbooks(),
    getBookOffers(),
  ]);

  return (
    <>
      <PublicAuthRefresh />
      <section className="bg-hero-gradient border-b border-border py-14">
        <PageShell flush>
          <p className="text-sm font-semibold mb-2 text-brand-orange">교재 단독 구매</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-brand-blue">
            AcademiQ 교재 스토어
          </h1>
          <p className="text-muted-foreground">
            온라인 교재(즉시 열람)와 외부 판매처 교재(소장용)를 한 곳에서 확인하고 구매할 수 있습니다.
          </p>
        </PageShell>
      </section>

      <section className="py-10 bg-white">
        <PageShell flush>
          <TextbookStoreClient
            initialTab={initialTab}
            onlineBooks={books}
            onlineLoadError={onlineError}
            offers={offers}
            offerLoadError={offerError}
          />
        </PageShell>
      </section>

      <section className="py-10 bg-muted/30 border-t">
        <PageShell flush>
          <div className="grid md:grid-cols-2 gap-4">
            <BrandCard accent="blue" padding="md">
              <div className="flex items-start gap-3">
                <Library className="w-5 h-5 mt-0.5 shrink-0 text-brand-blue" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">이미 구매한 온라인 교재가 있나요?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    내 강의실의 「내 교재」에서 즉시 열람할 수 있습니다.
                  </p>
                  <div className="mt-3">
                    <Link href="/textbooks">
                      <BrandButton variant="outline" size="sm">
                        내 교재 열람
                      </BrandButton>
                    </Link>
                  </div>
                </div>
              </div>
            </BrandCard>

            <BrandCard accent="orange" padding="md">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 mt-0.5 shrink-0 text-brand-orange" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">시험 접수 시 교재 북티켓을 발급받으셨나요?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    마이페이지에서 보유 중인 북티켓·이용권을 확인할 수 있습니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/mypage">
                      <BrandButton variant="outline" size="sm">
                        마이페이지 가기
                      </BrandButton>
                    </Link>
                    <Link href="/about/exam">
                      <BrandButton variant="ghost" size="sm">
                        시험 안내
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </BrandButton>
                    </Link>
                  </div>
                </div>
              </div>
            </BrandCard>
          </div>
        </PageShell>
      </section>
    </>
  );
}
