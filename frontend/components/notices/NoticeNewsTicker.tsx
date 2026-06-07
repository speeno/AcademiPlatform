'use client';

import { useEffect, useState } from 'react';
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
const ROTATE_INTERVAL_MS = 5_000;

interface NoticeNewsTickerProps {
  initialNotices: NoticeTickerItem[];
}

function NoticeTickerItem({ notice }: { notice: NoticeTickerItem }) {
  return (
    <Link
      href={`/notices/${notice.id}`}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 hover:text-brand-blue hover:underline"
    >
      {notice.isPinned && (
        <Pin className="h-3 w-3 shrink-0 text-brand-blue" aria-hidden="true" />
      )}
      <span className="truncate">{notice.title}</span>
      <span className="shrink-0 text-muted-foreground">
        {formatNoticeTickerDate(notice)}
      </span>
    </Link>
  );
}

export function NoticeNewsTicker({ initialNotices }: NoticeNewsTickerProps) {
  const [notices, setNotices] = useState(initialNotices);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  useEffect(() => {
    setActiveIndex((index) => {
      if (notices.length === 0) return 0;
      return index % notices.length;
    });
  }, [notices]);

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

  useEffect(() => {
    if (notices.length <= 1 || reducedMotion || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % notices.length);
    }, ROTATE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [notices.length, reducedMotion, paused]);

  if (notices.length === 0) return null;

  const currentNotice = notices[activeIndex] ?? notices[0];
  const shouldRotate = notices.length > 1 && !reducedMotion;

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

        <div
          className="relative min-w-0 flex-1 overflow-hidden text-xs text-foreground"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            key={currentNotice.id}
            className={shouldRotate ? 'notice-ticker-item' : 'truncate'}
            aria-live={shouldRotate ? 'polite' : undefined}
          >
            <NoticeTickerItem notice={currentNotice} />
          </div>
          {shouldRotate && (
            <span className="sr-only">
              {activeIndex + 1} / {notices.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
