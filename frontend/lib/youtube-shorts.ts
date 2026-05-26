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

export function resolveYoutubeThumbnailUrl(
  videoId: string,
  storedUrl?: string | null,
): string {
  const id = videoId.trim();
  if (!id) return (storedUrl ?? '').trim();
  const thumb = (storedUrl ?? '').trim();
  if (!thumb || isLowResYoutubeThumbnailUrl(thumb)) {
    return bestYoutubeThumbnailUrl(id);
  }
  const match = thumb.match(/\/vi\/([^/]+)\//);
  if (match && match[1] !== id) return bestYoutubeThumbnailUrl(id);
  return thumb;
}
