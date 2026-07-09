'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PageLoader } from '@/components/ui/page-loader';
import { verifyAuthSession } from '@/lib/auth';

// 인쇄 전용 라우트 그룹 — 사이드바/네비 없이 흰 배경만 제공한다.
// 교육 운영 권한 가드는 (classroom)/training 레이아웃과 동일하게 자체 수행.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await verifyAuthSession();
      if (!active) return;
      if (!session.valid || !session.trainingManager) {
        window.location.assign(
          `/training/login?next=${encodeURIComponent(pathname)}`,
        );
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  if (!ready) return <PageLoader />;
  return <div className="min-h-screen bg-white text-black">{children}</div>;
}
