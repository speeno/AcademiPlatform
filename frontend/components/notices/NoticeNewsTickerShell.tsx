import { NoticeNewsTicker } from '@/components/notices/NoticeNewsTicker';
import { parseNoticeTickerItems } from '@/components/notices/notice-ticker-types';
import { getServerApiBase } from '@/lib/api-base';

async function fetchTickerNotices() {
  try {
    const res = await fetch(`${getServerApiBase()}/notices?limit=10&scopeType=GLOBAL`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return parseNoticeTickerItems(await res.json());
  } catch {
    return [];
  }
}

export async function NoticeNewsTickerShell() {
  const notices = await fetchTickerNotices();
  return <NoticeNewsTicker initialNotices={notices} />;
}
