'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { ExamResultDetailView } from '@/components/exam/ExamResultDetailView';
import type { ExamResultDetail } from '@/components/exam/exam-result-types';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { ensureAuthCookieSync, forceLogoutToLogin, getAccessToken } from '@/lib/auth';

export default function MyExamResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ExamResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      ensureAuthCookieSync();
      if (!getAccessToken()) {
        forceLogoutToLogin(`/mypage/exam-results/${attemptId}`);
        return;
      }
      try {
        const res = await apiFetchWithAuth(`/online-exam/my/results/${attemptId}`);
        if (res.status === 401) {
          forceLogoutToLogin(`/mypage/exam-results/${attemptId}`);
          return;
        }
        if (res.status === 403) {
          setError('아직 공개되지 않은 결과입니다.');
          return;
        }
        if (!res.ok) {
          setError('결과를 불러오지 못했습니다.');
          return;
        }
        const data = await parseJsonSafe<ExamResultDetail | null>(res, null);
        setDetail(data);
      } catch {
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.push('/mypage/applications')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 접수 내역
        </BrandButton>
        <PageHeader title="시험 결과" description="문항별 답안·정오답·해설을 확인합니다." />
      </div>

      {error ? (
        <div className="rounded-xl border bg-white p-12 text-center text-muted-foreground">{error}</div>
      ) : detail ? (
        <ExamResultDetailView detail={detail} />
      ) : null}
    </div>
  );
}
