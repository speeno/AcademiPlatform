'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard, type VideoItem } from './VideoCard';

interface Props {
  items: VideoItem[];
  maxItems?: number;
}

export function ShortsCarousel({ items, maxItems }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = maxItems ? items.slice(0, maxItems) : items;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (visible.length === 0) return null;

  return (
    <div className="relative group/carousel">
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
