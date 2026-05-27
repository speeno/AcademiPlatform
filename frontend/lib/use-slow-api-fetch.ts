'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/api-base';
import { fetchWithTimeout, SLOW_API_TIMEOUT_MS } from '@/lib/fetch-with-timeout';

export type SlowApiFetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'timeout' | 'suspended';

type UseSlowApiFetchOptions<T> = {
  path: string;
  parse: (json: unknown) => T;
  maxAttempts?: number;
};

type UseSlowApiFetchResult<T> = {
  status: SlowApiFetchStatus;
  data: T | null;
  elapsedSeconds: number;
  retry: () => void;
};

function isSuspendedHtml(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('service suspended') || lower.includes('suspended by its owner');
}

export function useSlowApiFetch<T>({
  path,
  parse,
  maxAttempts = 2,
}: UseSlowApiFetchOptions<T>): UseSlowApiFetchResult<T> {
  const [status, setStatus] = useState<SlowApiFetchStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const mountedRef = useRef(true);
  const parseRef = useRef(parse);
  parseRef.current = parse;

  const retry = useCallback(() => {
    setAttemptKey((k) => k + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

    setStatus('loading');
    setData(null);
    setElapsedSeconds(0);

    const tick = window.setInterval(() => {
      if (!cancelled) setElapsedSeconds((s) => s + 1);
    }, 1000);

    async function run(attempt: number): Promise<void> {
      try {
        const res = await fetchWithTimeout(url, { cache: 'no-store' }, SLOW_API_TIMEOUT_MS);
        const text = await res.text();

        if (cancelled || !mountedRef.current) return;

        if (isSuspendedHtml(text)) {
          setStatus('suspended');
          return;
        }

        if (!res.ok) {
          if (attempt < maxAttempts) {
            await run(attempt + 1);
            return;
          }
          setStatus('error');
          return;
        }

        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          setStatus('error');
          return;
        }

        setData(parseRef.current(json));
        setStatus('success');
      } catch {
        if (cancelled || !mountedRef.current) return;
        if (attempt < maxAttempts) {
          await run(attempt + 1);
          return;
        }
        setStatus('timeout');
      }
    }

    void run(1);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [path, maxAttempts, attemptKey]);

  return { status, data, elapsedSeconds, retry };
}
