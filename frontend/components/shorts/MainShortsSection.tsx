'use client';

import { ShortsCarousel } from './ShortsCarousel';
import type { VideoItem } from './VideoCard';

interface Props {
  items: VideoItem[];
  maxItems?: number;
}

export function MainShortsSection({ items, maxItems = 6 }: Props) {
  return <ShortsCarousel items={items} maxItems={maxItems} />;
}
