'use client';

import { useEffect } from 'react';
import { BrandButton } from '@/components/ui/brand-button';

type SegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClassroomSegmentError({ error, reset }: SegmentErrorProps) {
  useEffect(() => {
    console.error('[classroom segment error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>
        학습 페이지 오류가 발생했습니다
      </h2>
      <p className="text-sm text-gray-500">
        일시적인 문제일 수 있습니다. 다시 시도하거나 새로고침해 주세요.
      </p>
      <BrandButton onClick={reset} variant="primary" size="sm">
        다시 시도
      </BrandButton>
    </div>
  );
}
