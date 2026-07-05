'use client';

import { useEffect, useState } from 'react';

/**
 * 인증이 필요한(Authorization 헤더) 또는 서명 URL이 없는(로컬 스토리지) 에셋을
 * fetch → Blob → object URL 로 변환해 `<img>`/`<video>`/`<iframe>` 에서 바로 쓸 수 있게 한다.
 * - `<img src>` 등은 헤더를 직접 실을 수 없으므로 blob URL 로 우회한다.
 * - src 가 null 이면 아무 것도 하지 않고 url=null 을 돌려준다.
 */
export function useAuthedBlobUrl(
  src: string | null,
  headers?: Record<string, string>,
): { url: string | null; loading: boolean; error: boolean } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const headerKey = JSON.stringify(headers ?? {});

  useEffect(() => {
    if (!src) {
      setUrl(null);
      setError(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    fetch(src, {
      headers: headers ?? {},
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`asset fetch failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // headerKey 로 headers 값 변경을 감지(객체 참조 변경 무시)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, headerKey]);

  return { url, loading, error };
}
