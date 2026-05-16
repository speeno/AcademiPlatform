'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeAuthState } from '@/lib/auth';

/** 시험 접수 목록: 로그인/로그아웃 시 서버 데이터·클라이언트 UI 동기화 */
export function ExamPageAuthRefresh() {
  const router = useRouter();

  useEffect(() => {
    return subscribeAuthState(() => {
      router.refresh();
    });
  }, [router]);

  return null;
}
