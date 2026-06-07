export type NoticeTickerItem = {
  id: string;
  title: string;
  isPinned?: boolean;
  publishedAt?: string | null;
  createdAt: string;
};

export function parseNoticeTickerItems(json: unknown): NoticeTickerItem[] {
  const data = json as { notices?: unknown };
  if (!Array.isArray(data?.notices)) return [];
  return data.notices
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      isPinned: Boolean(item.isPinned),
      publishedAt:
        typeof item.publishedAt === 'string' || item.publishedAt === null
          ? item.publishedAt
          : undefined,
      createdAt: String(item.createdAt ?? ''),
    }))
    .filter((item) => item.id && item.title);
}

export function formatNoticeTickerDate(item: NoticeTickerItem): string {
  const raw = item.publishedAt ?? item.createdAt;
  if (!raw) return '';
  return new Date(raw).toLocaleDateString('ko-KR');
}

/** 트랙 너비가 뷰포트를 넘도록 반복해 단일 공지도 스크롤이 보이게 함 */
export function buildTickerSegments(
  notices: NoticeTickerItem[],
  minSegments = 12,
): NoticeTickerItem[] {
  if (notices.length === 0) return [];
  const segments: NoticeTickerItem[] = [];
  while (segments.length < minSegments) {
    segments.push(...notices);
  }
  return segments;
}
