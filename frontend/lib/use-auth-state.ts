'use client';

import { useEffect, useState } from 'react';
import { isLoggedIn, subscribeAuthState } from './auth';

/** 클라이언트 로그인 여부. 로그인/로그아웃 시 자동 갱신 */
export function useAuthState(): boolean | null {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    sync();
    return subscribeAuthState(sync);
  }, []);

  return loggedIn;
}
