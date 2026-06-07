'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { PageLoader } from '@/components/ui/page-loader';
import { ExamResultDetailView } from '@/components/exam/ExamResultDetailView';
import type { ExamResultDetail } from '@/components/exam/exam-result-types';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

export default function AdminExamResultDetailPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ExamResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const load = async () => {
    const res = await apiFetchWithAuth(`/online-exam/admin/attempts/${attemptId}/result`);
    if (res.ok) {
      const data = await parseJsonSafe<ExamResultDetail | null>(res, null);
      setDetail(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [attemptId]);

  const publish = async () => {
    if (!confirm('결과를 공개하고 이메일을 발송할까요?')) return;
    setPublishing(true);
    try {
      const finalizeRes = await apiFetchWithAuth(`/online-exam/admin/attempts/${attemptId}/finalize`, {
        method: 'POST',
      });
      if (!finalizeRes.ok) {
        alert('결과 확정에 실패했습니다.');
        return;
      }
      const res = await apiFetchWithAuth(`/online-exam/admin/attempts/${attemptId}/publish-result`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('결과가 공개되었습니다.');
        await load();
      } else {
        alert('결과 공개에 실패했습니다.');
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageLoader />;

  const published = !!detail?.result?.publishedAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandButton variant="ghost" size="sm" onClick={() => router.push(`/admin/exam/${id}/results`)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> 결과 목록
          </BrandButton>
          <PageHeader title="시험 결과 상세" description="문항별 답안과 채점 내역을 확인합니다." />
        </div>
        {detail?.result && !published && (
          <BrandButton variant="primary" size="sm" loading={publishing} onClick={publish}>
            결과 공개
          </BrandButton>
        )}
      </div>

      {detail ? (
        <ExamResultDetailView detail={detail} showUser />
      ) : (
        <div className="rounded-xl border bg-white p-12 text-center text-muted-foreground">
          결과를 불러오지 못했습니다.
        </div>
      )}
    </div>
  );
}
