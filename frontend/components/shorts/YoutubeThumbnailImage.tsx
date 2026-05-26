'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  resolveYoutubeThumbnailUrl,
  youtubeThumbnailFallbackUrls,
} from '@/lib/youtube-shorts';

type Props = {
  videoId: string;
  storedUrl?: string | null;
  alt: string;
  className?: string;
};

/** maxresdefault → sddefault → hqdefault → mqdefault 순으로 onError 폴백 */
export function YoutubeThumbnailImage({ videoId, storedUrl, alt, className }: Props) {
  const candidates = useMemo(() => {
    const primary = resolveYoutubeThumbnailUrl(videoId, storedUrl);
    const fallbacks = youtubeThumbnailFallbackUrls(videoId);
    const seen = new Set<string>();
    return [primary, ...fallbacks].filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [videoId, storedUrl]);

  const [index, setIndex] = useState(0);
  const src = candidates[index] ?? '';

  const onError = useCallback(() => {
    setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}
