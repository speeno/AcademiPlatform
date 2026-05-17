'use client';

import { useEffect } from 'react';

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
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>
            예상치 못한 오류가 발생했습니다
          </h1>
          <p className="text-sm text-gray-500">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 지원팀에 문의해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
