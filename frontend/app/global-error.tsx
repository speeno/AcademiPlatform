'use client';

import { useEffect } from 'react';
import { BrandButton } from '@/components/ui/brand-button';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-heading text-brand-blue">
            예상치 못한 오류가 발생했습니다
          </h1>
          <p className="text-caption">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 지원팀에 문의해 주세요.
          </p>
          <BrandButton type="button" onClick={reset} variant="primary" size="sm">
            다시 시도
          </BrandButton>
        </main>
      </body>
    </html>
  );
}
