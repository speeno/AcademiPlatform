import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PriceDisplay } from '@/components/ui/price-display';

export interface BookOfferItem {
  id: string;
  code?: string;
  title: string;
  price: number;
  coverImageUrl?: string;
  purchaseUrl: string;
}

interface BookOfferCardProps {
  book: BookOfferItem;
}

export function BookOfferCard({ book }: BookOfferCardProps) {
  return (
    <BrandCard
      accent="sky"
      padding="none"
      className="overflow-hidden h-full flex flex-col"
    >
      <div
        className="h-52 bg-muted bg-center bg-cover flex items-center justify-center"
        style={{ backgroundImage: book.coverImageUrl ? `url(${book.coverImageUrl})` : undefined }}
      >
        <BookOpen className="w-10 h-10 text-white/80" />
      </div>
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <p className="text-xs font-semibold mb-2 text-brand-sky">{book.code ?? '-'}</p>
        <BrandCardTitle className="text-sm line-clamp-2 mb-2">{book.title}</BrandCardTitle>
        <p className="text-xs text-muted-foreground mb-4">(소장)</p>
        <div className="mt-auto space-y-3">
          <PriceDisplay price={book.price} className="text-sm font-semibold text-brand-orange" />
          <Link href={book.purchaseUrl} target="_blank" rel="noopener noreferrer">
            <BrandButton variant="primary" size="sm" fullWidth>
              외부 판매처 이동
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </BrandButton>
          </Link>
        </div>
      </div>
    </BrandCard>
  );
}
