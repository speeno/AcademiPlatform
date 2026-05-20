'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText } from 'lucide-react';
import { BookOfferCard, type BookOfferItem } from '@/components/store/BookOfferCard';
import {
  TextbookStoreCard,
  type TextbookStoreCardItem,
} from '@/components/store/TextbookStoreCard';
import { useAuthState } from '@/lib/use-auth-state';
import { runPortOneCheckout } from '@/lib/payment';
import { apiFetchWithAuth } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type StoreTextbook = TextbookStoreCardItem;

export interface BookOffer extends BookOfferItem {
  isActive?: boolean;
}

type StoreTab = 'online' | 'external';

interface Props {
  initialTab: StoreTab;
  onlineBooks: StoreTextbook[];
  onlineLoadError: boolean;
  offers: BookOffer[];
  offerLoadError: boolean;
}

const TAB_LIST: { id: StoreTab; label: string; description: string }[] = [
  { id: 'online', label: '온라인 교재', description: '결제 후 즉시 열람' },
  { id: 'external', label: '외부 판매처 교재', description: '인쇄·소장용 별도 판매' },
];

export function TextbookStoreClient({
  initialTab,
  onlineBooks,
  onlineLoadError,
  offers,
  offerLoadError,
}: Props) {
  const router = useRouter();
  const isAuthed = useAuthState();
  const [tab, setTab] = useState<StoreTab>(initialTab);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const switchTab = (next: StoreTab) => {
    setTab(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleOnlinePurchase = async (book: StoreTextbook) => {
    if (book.hasAccess) return;

    if (isAuthed === false) {
      router.push(`/login?next=${encodeURIComponent(`/store/textbooks/${book.id}`)}`);
      return;
    }

    if (book.displayFee == null) return;

    setBuyingId(book.id);
    try {
      const reqRes = await apiFetchWithAuth(`/textbooks/${book.id}/purchase`, {
        method: 'POST',
        credentials: 'include',
      });
      const reqData = await reqRes.json().catch(() => ({}));
      if (!reqRes.ok) {
        throw new Error(reqData.message ?? '구매 요청에 실패했습니다.');
      }

      await runPortOneCheckout({
        targetType: 'TEXTBOOK',
        targetId: book.id,
        amountHint: book.displayFee,
        name: `${book.title} 교재 구매`,
      });
      toast.success('교재 결제가 완료되었습니다.');
      router.push(`/textbooks/${book.id}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 결제 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <nav
        role="tablist"
        aria-label="교재 스토어 탭"
        className="flex flex-wrap gap-2 border-b border-border"
      >
        {TAB_LIST.map((entry) => {
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => switchTab(entry.id)}
              className={cn(
                '-mb-px inline-flex flex-col items-start gap-0.5 px-4 py-3 border-b-2 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
                active
                  ? 'border-brand-orange text-brand-blue'
                  : 'border-transparent text-muted-foreground hover:text-brand-blue',
              )}
            >
              <span className="text-sm font-semibold">{entry.label}</span>
              <span className="text-[11px] text-muted-foreground">{entry.description}</span>
            </button>
          );
        })}
      </nav>

      {tab === 'online' ? (
        <OnlineTextbookList
          books={onlineBooks}
          loadError={onlineLoadError}
          buyingId={buyingId}
          isAuthed={isAuthed}
          onPurchase={handleOnlinePurchase}
        />
      ) : (
        <ExternalOfferList offers={offers} loadError={offerLoadError} />
      )}
    </div>
  );
}

interface OnlineProps {
  books: StoreTextbook[];
  loadError: boolean;
  buyingId: string | null;
  isAuthed: boolean | null;
  onPurchase: (book: StoreTextbook) => void;
}

function OnlineTextbookList({ books, loadError, buyingId, isAuthed, onPurchase }: OnlineProps) {
  if (loadError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-foreground font-medium">온라인 교재를 일시적으로 불러올 수 없습니다.</p>
        <p className="text-sm mt-1">잠시 후 새로고침해 주세요.</p>
      </div>
    );
  }
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>현재 단독 구매 가능한 온라인 교재가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {books.map((book) => (
        <TextbookStoreCard
          key={book.id}
          book={book}
          buyingId={buyingId}
          isAuthed={isAuthed}
          onPurchase={onPurchase}
        />
      ))}
    </div>
  );
}

interface ExternalProps {
  offers: BookOffer[];
  loadError: boolean;
}

function ExternalOfferList({ offers, loadError }: ExternalProps) {
  if (loadError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-foreground font-medium">외부 판매처 정보를 일시적으로 불러올 수 없습니다.</p>
        <p className="text-sm mt-1">잠시 후 새로고침해 주세요.</p>
      </div>
    );
  }
  if (offers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>현재 외부 판매처에서 구매 가능한 교재가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {offers.map((book) => (
        <BookOfferCard key={book.id} book={book} />
      ))}
    </div>
  );
}
