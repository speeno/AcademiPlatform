'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { API_BASE } from '@/lib/api-base';
import { getAccessToken } from '@/lib/auth';

function getSessionId(): string {
  const KEY = 'pv_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung';
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  return 'Other';
}

function parseDevice(ua: string): string {
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getUserId(): string | null {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload.id ?? null;
  } catch (err) {
    console.warn('[PageViewTracker] JWT decode failed', err);
    return null;
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    try {
      const ua = navigator.userAgent;
      const payload = JSON.stringify({
        path: pathname,
        sessionId: getSessionId(),
        userId: getUserId(),
        userAgent: ua,
        browser: parseBrowser(ua),
        deviceType: parseDevice(ua),
        referrer: document.referrer || null,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${API_BASE}/analytics/pageview`,
          new Blob([payload], { type: 'application/json' }),
        );
      } else {
        fetch(`${API_BASE}/analytics/pageview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // silent fail
    }
  }, [pathname]);

  return null;
}
