'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader, getAccessToken, subscribeAuthState } from './auth';

/**
 * 클라이언트 로그인 여부 — Navbar와 동일하게 /auth/me 로 검증한다.
 * localStorage 토큰만 보면 만료·무효 토큰에도 가격이 노출될 수 있어 API 검증을 사용한다.
 */
export function useAuthState(): boolean | null {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      const token = getAccessToken();
      if (!token) {
        if (active) setLoggedIn(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          headers: buildAuthHeader(false),
        });
        if (!active) return;
        setLoggedIn(res.ok);
      } catch {
        if (active) setLoggedIn(false);
      }
    };

    void sync();
    return subscribeAuthState(() => {
      void sync();
    });
  }, []);

  return loggedIn;
}
