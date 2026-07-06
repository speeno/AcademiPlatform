'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export type PromoPoster = {
  src: string;
  alt: string;
  title?: string;
  tags?: string[];
};

/**
 * 홍보 포스터(1055×1491) 반응형 그리드 + 라이트박스.
 * 썸네일은 next/image 로 최적화 지연 로딩하고, 클릭 시 전체 포스터를 모달로 확대한다.
 */
export function PromoPosterGallery({
  posters,
  columns = 3,
}: {
  posters: PromoPoster[];
  columns?: 2 | 3 | 4;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? i : (i - 1 + posters.length) % posters.length,
      ),
    [posters.length],
  );
  const showNext = useCallback(
    () => setActiveIndex((i) => (i === null ? i : (i + 1) % posters.length)),
    [posters.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, showPrev, showNext]);

  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  const active = activeIndex !== null ? posters[activeIndex] : null;

  return (
    <>
      <ul className={`grid grid-cols-1 gap-5 ${gridCols}`}>
        {posters.map((poster, i) => (
          <li key={poster.src}>
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${poster.title ?? poster.alt} 크게 보기`}
              className="group block w-full overflow-hidden rounded-2xl border border-border bg-white text-left shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <span className="relative block">
                <Image
                  src={poster.src}
                  alt={poster.alt}
                  width={1055}
                  height={1491}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-brand-blue/0 transition group-hover:bg-brand-blue/10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-blue opacity-0 shadow transition group-hover:opacity-100">
                    <ZoomIn className="h-3.5 w-3.5" /> 크게 보기
                  </span>
                </span>
              </span>
              {(poster.title || poster.tags?.length) && (
                <span className="block border-t border-border px-4 py-3">
                  {poster.title && (
                    <span className="block text-sm font-bold text-foreground">
                      {poster.title}
                    </span>
                  )}
                  {poster.tags?.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {poster.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-brand-blue-subtle px-2 py-0.5 text-[11px] font-semibold text-brand-blue"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-blue-dark/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? active.alt}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          {posters.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="이전 포스터"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 md:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="다음 포스터"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 md:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <figure
            className="flex max-h-[92vh] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 라이트박스 전체 포스터는 명시적 확대 액션이므로 원본 최적화 JPEG 를 그대로 표시 */}
            <img
              src={active.src}
              alt={active.alt}
              className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            {active.title && (
              <figcaption className="mt-3 text-center text-sm font-semibold text-white">
                {active.title}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
