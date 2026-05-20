'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, FileText, ShoppingCart } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PriceDisplay } from '@/components/ui/price-display';

export interface TextbookStoreCardItem {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  price: number | null;
  displayFee: number | null;
  hasAccess?: boolean;
}

interface TextbookStoreCardProps {
  book: TextbookStoreCardItem;
  buyingId: string | null;
  isAuthed: boolean | null;
  onPurchase: (book: TextbookStoreCardItem) => void;
}

export function TextbookStoreCard({
  book,
  buyingId,
  isAuthed,
  onPurchase,
}: TextbookStoreCardProps) {
  const ctaPrice = book.displayFee ?? book.price ?? null;
  const isFree = ctaPrice === 0;
  const detailHref = `/store/textbooks/${book.id}`;

  return (
    <BrandCard accent="sky" padding="none" className="overflow-hidden h-full flex flex-col">
      <Link href={detailHref} className="block h-44 bg-muted relative">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            width={176}
            height={176}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <Link href={detailHref}>
          <BrandCardTitle className="mb-1 line-clamp-2 text-sm hover:text-brand-blue">
            {book.title}
          </BrandCardTitle>
        </Link>
        {book.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{book.description}</p>
        )}
        <div className="mt-auto space-y-3">
          <PriceDisplay price={ctaPrice} className="text-sm font-semibold text-brand-orange" />
          {book.hasAccess ? (
            <Link href={`/textbooks/${book.id}`}>
              <BrandButton variant="outline" size="sm" fullWidth>
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                열람하기
              </BrandButton>
            </Link>
          ) : isAuthed === false ? (
            <Link href={`/login?next=${encodeURIComponent(detailHref)}`}>
              <BrandButton variant="primary" size="sm" fullWidth>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                로그인 후 구매
              </BrandButton>
            </Link>
          ) : (
            <>
              <BrandButton
                variant="primary"
                size="sm"
                fullWidth
                disabled={isFree || isAuthed === null}
                loading={buyingId === book.id}
                onClick={() => onPurchase(book)}
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                {isFree ? '무료 제공' : '구매하기'}
              </BrandButton>
              <Link href={detailHref}>
                <BrandButton variant="ghost" size="sm" fullWidth>
                  상세 보기
                </BrandButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </BrandCard>
  );
}
