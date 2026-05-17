'use client';

import { useEffect } from 'react';
import { BrandButton } from '@/components/ui/brand-button';

type SegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicSegmentError({ error, reset }: SegmentErrorProps) {
  useEffect(() => {
    console.error('[public segment error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>
        페이지를 불러오는 중 문제가 발생했습니다
      </h2>
      <p className="text-sm text-gray-500">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
      </p>
      <BrandButton onClick={reset} variant="primary" size="sm">
        다시 시도
      </BrandButton>
    </div>
  );
}
