'use client';

import { ShortsCarousel } from './ShortsCarousel';
import type { VideoItem } from './VideoCard';

interface Props {
  items: VideoItem[];
  maxItems?: number;
  autoPlay?: boolean;
}

export function MainShortsSection({ items, maxItems = 6, autoPlay = false }: Props) {
  return <ShortsCarousel items={items} maxItems={maxItems} autoPlay={autoPlay} />;
}
