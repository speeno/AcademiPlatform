'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import { verifyAuthSession } from '@/lib/auth';

// 교육 운영 영역 전체 가드. 세션이 없으면 전용 수업관리 로그인으로,
// 권한(trainingManager)이 없으면 마이페이지로 돌려보낸다.
// (실질 권한 검증은 백엔드 403 — 이 가드는 UX 용)
export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const session = await verifyAuthSession();
      if (!active) return;

      if (!session.valid) {
        window.location.assign(
          `/training/login?next=${encodeURIComponent(pathname)}`,
        );
        return;
      }
      if (!session.trainingManager) {
        toast.error('교육 운영 권한이 없습니다.');
        router.replace('/mypage');
        return;
      }
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) return <PageLoader />;
  return <>{children}</>;
}
