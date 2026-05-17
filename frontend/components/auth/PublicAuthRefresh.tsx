'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeAuthState } from '@/lib/auth';

/** 로그인/로그아웃 시 SSR 가격 데이터를 다시 불러오기 위해 router.refresh() */
export function PublicAuthRefresh() {
  const router = useRouter();

  useEffect(() => {
    return subscribeAuthState(() => {
      router.refresh();
    });
  }, [router]);

  return null;
}
