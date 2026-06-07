'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Pin } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import {
  formatNoticeTickerDate,
  parseNoticeTickerItems,
  type NoticeTickerItem,
} from '@/components/notices/notice-ticker-types';

const TICKER_API_PATH = '/notices?limit=10&scopeType=GLOBAL';
const POLL_INTERVAL_MS = 60_000;

interface NoticeNewsTickerProps {
  initialNotices: NoticeTickerItem[];
}

function NoticeTickerItems({ notices }: { notices: NoticeTickerItem[] }) {
  return (
    <>
      {notices.map((notice, index) => (
        <span key={`${notice.id}-${index}`} className="inline-flex items-center gap-1.5 shrink-0">
          {index > 0 && <span className="text-muted-foreground/60 px-2" aria-hidden="true">·</span>}
          <Link
            href={`/notices/${notice.id}`}
            className="inline-flex items-center gap-1 hover:text-brand-blue hover:underline"
          >
            {notice.isPinned && (
              <Pin className="h-3 w-3 shrink-0 text-brand-blue" aria-label="고정 공지" />
            )}
            <span className="truncate max-w-[28rem]">{notice.title}</span>
            <span className="text-muted-foreground shrink-0">
              {formatNoticeTickerDate(notice)}
            </span>
          </Link>
        </span>
      ))}
    </>
  );
}

export function NoticeNewsTicker({ initialNotices }: NoticeNewsTickerProps) {
  const [notices, setNotices] = useState(initialNotices);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const res = await fetch(`${API_BASE}${TICKER_API_PATH}`, { cache: 'no-store' });
        if (!res.ok || !active) return;
        const data = await res.json();
        setNotices(parseNoticeTickerItems(data));
      } catch {
        // ignore polling errors
      }
    };

    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const shouldAnimate = useMemo(
    () => notices.length > 1 && !reducedMotion,
    [notices.length, reducedMotion],
  );

  if (notices.length === 0) return null;

  return (
    <div
      className="notice-ticker border-b border-border bg-brand-blue-subtle"
      aria-label="최신 공지사항"
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/notices"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          공지
        </Link>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          {shouldAnimate ? (
            <div className="notice-ticker-track inline-flex whitespace-nowrap text-xs text-foreground">
              <NoticeTickerItems notices={notices} />
              <span className="px-6" aria-hidden="true" />
              <NoticeTickerItems notices={notices} />
            </div>
          ) : (
            <div className="truncate text-xs text-foreground">
              <NoticeTickerItems notices={notices.slice(0, 1)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
