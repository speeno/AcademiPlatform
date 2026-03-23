'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Loader2, BookOpen, ShoppingCart } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { runPortOneCheckout } from '@/lib/payment';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';

interface Textbook {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
  price: number;
}

interface StoreTextbook extends Textbook {
  hasAccess: boolean;
}

export default function TextbooksPage() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [storeBooks, setStoreBooks] = useState<StoreTextbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [ownedRes, storeRes] = await Promise.all([
        fetch(`${API_BASE}/textbooks`, { headers: buildAuthHeader(false), credentials: 'include' }),
        fetch(`${API_BASE}/textbooks/store`, { headers: buildAuthHeader(false), credentials: 'include' }),
      ]);
      if (ownedRes.ok) setTextbooks(await ownedRes.json());
      if (storeRes.ok) setStoreBooks(await storeRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        await loadAll();
      } catch {
        // ignore
      }
    };
    fetch_();
  }, []);

  const handlePurchase = async (book: StoreTextbook) => {
    if (book.hasAccess) return;
    setBuyingId(book.id);
    try {
      const reqRes = await fetch(`${API_BASE}/textbooks/${book.id}/purchase`, {
        method: 'POST',
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const reqData = await reqRes.json().catch(() => ({}));
      if (!reqRes.ok) throw new Error(reqData.message ?? '구매 요청에 실패했습니다.');

      await runPortOneCheckout({
        targetType: 'TEXTBOOK',
        targetId: book.id,
        amountHint: book.price,
        name: `${book.title} 교재 구매`,
      });
      toast.success('교재 결제가 완료되었습니다.');
      await loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 결제 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>내 교재</h1>
        <p className="text-sm text-gray-500 mt-1">접근 가능한 온라인 교재를 열람하세요.</p>
        <p className="text-sm text-gray-500 mt-2">
          교재를 별도로 구매하시려면{' '}
          <Link href="/books" className="font-semibold hover:underline" style={{ color: 'var(--brand-blue)' }}>
            주요 교재 구매
          </Link>
          에서 구매할 수 있습니다.
        </p>
      </div>

      {textbooks.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-2">접근 가능한 교재가 없습니다.</p>
          <p className="text-xs text-gray-400">강좌 수강 신청 시 교재가 자동으로 제공됩니다.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {textbooks.map((book) => (
            <Link key={book.id} href={`/textbooks/${book.id}`}>
              <BrandCard hoverable accent="orange" padding="none" className="overflow-hidden h-full flex flex-col">
                <div
                  className="h-44 flex items-center justify-center"
                  style={{ background: 'var(--gradient-logo)' }}
                >
                  {book.coverImageUrl ? (
                    <Image src={book.coverImageUrl} alt={book.title} width={176} height={176} className="h-44 w-full object-cover" />
                  ) : (
                    <FileText className="w-12 h-12 text-white opacity-70" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <BrandCardTitle className="mb-1 line-clamp-2 text-sm">{book.title}</BrandCardTitle>
                  {book.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">{book.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                    {book.totalPages && <span>{book.totalPages}페이지</span>}
                    <span className="font-semibold" style={{ color: 'var(--brand-orange)' }}>
                      열람하기 →
                    </span>
                  </div>
                </div>
              </BrandCard>
            </Link>
          ))}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>교재 스토어</h2>
          <p className="text-sm text-gray-500 mt-1">단독 구매 가능한 교재를 결제 후 즉시 열람할 수 있습니다.</p>
        </div>
        {storeBooks.length === 0 ? (
          <div className="text-sm text-gray-400 border rounded-xl p-6 bg-white">구매 가능한 교재가 없습니다.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {storeBooks.map((book) => (
              <BrandCard key={book.id} hoverable accent="sky" padding="none" className="overflow-hidden h-full flex flex-col">
                <div className="h-44 bg-gray-100 flex items-center justify-center">
                  {book.coverImageUrl ? (
                    <Image src={book.coverImageUrl} alt={book.title} width={176} height={176} className="h-44 w-full object-cover" />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <BrandCardTitle className="mb-1 line-clamp-2 text-sm">{book.title}</BrandCardTitle>
                  {book.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{book.description}</p>}
                  <div className="mt-auto space-y-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--brand-orange)' }}>
                      {book.price.toLocaleString()}원
                    </p>
                    {book.hasAccess ? (
                      <Link href={`/textbooks/${book.id}`}>
                        <BrandButton variant="outline" size="sm" fullWidth>열람하기</BrandButton>
                      </Link>
                    ) : (
                      <BrandButton
                        variant="primary"
                        size="sm"
                        fullWidth
                        loading={buyingId === book.id}
                        onClick={() => handlePurchase(book)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                        구매하기
                      </BrandButton>
                    )}
                  </div>
                </div>
              </BrandCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
