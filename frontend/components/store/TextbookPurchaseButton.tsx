'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { useAuthState } from '@/lib/use-auth-state';
import { apiFetchWithAuth } from '@/lib/api-client';
import { runPortOneCheckout } from '@/lib/payment';
import { toast } from 'sonner';
import {
  ONLINE_TEXTBOOK_STORE_AVAILABLE,
  ONLINE_TEXTBOOK_UNAVAILABLE_LABEL,
} from '@/lib/online-textbook-store';

interface TextbookPurchaseButtonProps {
  textbookId: string;
  title: string;
  displayFee: number | null;
  hasAccess?: boolean;
  nextPath?: string;
}

export function TextbookPurchaseButton({
  textbookId,
  title,
  displayFee,
  hasAccess = false,
  nextPath,
}: TextbookPurchaseButtonProps) {
  const router = useRouter();
  const isAuthed = useAuthState();
  const [loading, setLoading] = useState(false);

  const loginNext =
    nextPath ?? `/store/textbooks/${textbookId}`;

  if (!ONLINE_TEXTBOOK_STORE_AVAILABLE) {
    return (
      <BrandButton variant="primary" size="lg" fullWidth disabled>
        {ONLINE_TEXTBOOK_UNAVAILABLE_LABEL}
      </BrandButton>
    );
  }

  if (hasAccess) {
    return (
      <Link href={`/textbooks/${textbookId}`}>
        <BrandButton variant="primary" size="lg" fullWidth>
          열람하기
        </BrandButton>
      </Link>
    );
  }

  if (isAuthed === false) {
    return (
      <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>
        <BrandButton variant="primary" size="lg" fullWidth>
          <ShoppingCart className="w-4 h-4 mr-1" />
          로그인 후 구매
        </BrandButton>
      </Link>
    );
  }

  const isFree = displayFee === 0;

  const handlePurchase = async () => {
    if (displayFee == null) return;

    setLoading(true);
    try {
      const reqRes = await apiFetchWithAuth(`/textbooks/${textbookId}/purchase`, {
        method: 'POST',
        credentials: 'include',
      });
      const reqData = await reqRes.json().catch(() => ({}));
      if (!reqRes.ok) {
        throw new Error(reqData.message ?? '구매 요청에 실패했습니다.');
      }

      await runPortOneCheckout({
        targetType: 'TEXTBOOK',
        targetId: textbookId,
        amountHint: displayFee,
        name: `${title} 교재 구매`,
      });
      toast.success('교재 결제가 완료되었습니다.');
      router.push(`/textbooks/${textbookId}`);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '교재 결제 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandButton
      variant="primary"
      size="lg"
      fullWidth
      disabled={isFree || isAuthed === null}
      loading={loading}
      onClick={handlePurchase}
    >
      <ShoppingCart className="w-4 h-4 mr-1" />
      {isFree ? '무료 제공' : '구매하기'}
    </BrandButton>
  );
}
