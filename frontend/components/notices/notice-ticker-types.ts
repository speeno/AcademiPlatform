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
