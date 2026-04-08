'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard, type VideoItem } from './VideoCard';

interface Props {
  items: VideoItem[];
  maxItems?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function ShortsCarousel({
  items,
  maxItems,
  autoPlay = false,
  autoPlayInterval = 3000,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paused, setPaused] = useState(false);
  const visible = maxItems ? items.slice(0, maxItems) : items;

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > div')?.clientWidth ?? 192;
    const gap = 16;
    const step = cardWidth + gap;

    if (dir === 'right') {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 2) {
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    if (!autoPlay || paused || visible.length <= 1) return;

    timerRef.current = setInterval(() => scroll('right'), autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, autoPlayInterval, paused, visible.length, scroll]);

  if (visible.length === 0) return null;

  return (
    <div
      className="relative group/carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border shadow flex items-center justify-center text-gray-600 hover:bg-white opacity-0 group-hover/carousel:opacity-100 transition-opacity -translate-x-3"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visible.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-44 sm:w-48">
            <VideoCard item={item} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border shadow flex items-center justify-center text-gray-600 hover:bg-white opacity-0 group-hover/carousel:opacity-100 transition-opacity translate-x-3"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
