/** YouTube 정적 썸네일 품질 (높은 순). 0/default는 120×90으로 UI 확대 시 깨짐. */
export const YOUTUBE_THUMB_QUALITIES = [
  'maxresdefault',
  'sddefault',
  'hqdefault',
  'mqdefault',
] as const;

export type YoutubeThumbQuality = (typeof YOUTUBE_THUMB_QUALITIES)[number];

export function buildYoutubeThumbnailUrl(
  videoId: string,
  quality: YoutubeThumbQuality = 'maxresdefault',
): string {
  const id = videoId.trim();
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

export function youtubeThumbnailFallbackUrls(videoId: string): string[] {
  const id = videoId.trim();
  if (!id) return [];
  return YOUTUBE_THUMB_QUALITIES.map((q) => buildYoutubeThumbnailUrl(id, q));
}

/** 저장·표시용 최고 품질 URL (브라우저 onError로 하위 품질 폴백) */
export function bestYoutubeThumbnailUrl(videoId: string): string {
  return buildYoutubeThumbnailUrl(videoId, 'maxresdefault');
}

const LOW_RES_YOUTUBE_THUMB = /\/vi\/[^/]+\/(0|default|1|2|3|mqdefault)\.jpg(\?.*)?$/i;

export function isLowResYoutubeThumbnailUrl(url: string): boolean {
  return LOW_RES_YOUTUBE_THUMB.test(url.trim());
}

export function buildYoutubeShortsLinkUrl(videoId: string): string {
  const id = videoId.trim();
  if (!id) return '';
  return `https://www.youtube.com/shorts/${id}`;
}

export type ShortsGalleryItem = {
  id: string;
  type?: string;
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** YouTube 항목: 빈·저해상도 썸네일·링크를 고해상도·Shorts URL로 정규화 */
export function normalizeShortsYoutubeItem<T extends ShortsGalleryItem>(item: T): T {
  const type = item.type ?? 'youtube';
  const videoId = (item.videoId ?? '').trim();
  if (type !== 'youtube' || !videoId) return { ...item, videoId };

  const thumb = (item.thumbnailUrl ?? '').trim();
  const link = (item.linkUrl ?? '').trim();
  const thumbVideoMatch = thumb.match(/\/vi\/([^/]+)\//);
  const thumbWrongVideo = thumbVideoMatch != null && thumbVideoMatch[1] !== videoId;

  const thumbnailUrl =
    !thumb || isLowResYoutubeThumbnailUrl(thumb) || thumbWrongVideo
      ? bestYoutubeThumbnailUrl(videoId)
      : thumb;

  return {
    ...item,
    videoId,
    thumbnailUrl,
    linkUrl: link || buildYoutubeShortsLinkUrl(videoId),
  };
}

/** 갤러리 전체 YouTube 썸네일·링크 일괄 정규화 (스크립트·관리 API 공용) */
export function regenerateShortsGalleryItems(items: ShortsGalleryItem[]): {
  items: ShortsGalleryItem[];
  updated: number;
} {
  let updated = 0;
  const next = items.map((item) => {
    const beforeThumb = (item.thumbnailUrl ?? '').trim();
    const beforeLink = (item.linkUrl ?? '').trim();
    const normalized = normalizeShortsYoutubeItem(item);
    const changed =
      beforeThumb !== (normalized.thumbnailUrl ?? '').trim() ||
      beforeLink !== (normalized.linkUrl ?? '').trim();
    if (changed) updated += 1;
    return normalized;
  });
  return { items: next, updated };
}
