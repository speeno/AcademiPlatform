'use client';

import { useEffect } from 'react';
import { BrandButton } from '@/components/ui/brand-button';

type SegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminSegmentError({ error, reset }: SegmentErrorProps) {
  useEffect(() => {
    console.error('[admin segment error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-heading text-brand-blue">
        관리자 페이지 오류가 발생했습니다
      </h2>
      <p className="text-caption">
        잠시 후 다시 시도해 주세요. 동일한 문제가 계속되면 운영자에게 문의해 주세요.
      </p>
      <BrandButton onClick={reset} variant="primary" size="sm">
        다시 시도
      </BrandButton>
    </div>
  );
}
