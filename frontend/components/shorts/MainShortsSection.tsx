'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { VideoItem } from './VideoCard';

interface Props {
  items: VideoItem[];
  maxItems?: number;
  autoPlay?: boolean;
}

const ShortsCarousel = dynamic(
  () => import('./ShortsCarousel').then((mod) => mod.ShortsCarousel),
  {
    ssr: false,
    loading: () => (
      <div className="h-[22rem] w-full animate-pulse rounded-xl border bg-muted/40" />
    ),
  },
);

export function MainShortsSection({ items, maxItems = 6, autoPlay = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || isVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={rootRef}>
      {isVisible ? (
        <ShortsCarousel
          items={items}
          maxItems={maxItems}
          autoPlay={autoPlay}
        />
      ) : (
        <div className="h-[22rem] w-full rounded-xl border bg-muted/20" />
      )}
    </div>
  );
}
