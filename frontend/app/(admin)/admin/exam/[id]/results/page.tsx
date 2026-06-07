'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageLoader } from '@/components/ui/page-loader';
import type { ExamResultListEntry } from '@/components/exam/exam-result-types';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

const attemptStatusLabels: Record<string, string> = {
  SUBMITTED: '제출됨',
  AUTO_GRADED: '자동 채점',
  MANUAL_GRADING: '수동 채점 대기',
  GRADED: '채점 완료',
  INVALIDATED: '무효',
};

export default function AdminExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<ExamResultListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/results`);
    if (res.ok) {
      const data = await parseJsonSafe<ExamResultListEntry[]>(res, []);
      setEntries(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const publish = async (attemptId: string) => {
    if (!confirm('결과를 공개하고 이메일을 발송할까요?')) return;
    setPublishingId(attemptId);
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
      setPublishingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 뒤로
        </BrandButton>
        <PageHeader title="시험 결과" description="응시자별 점수와 결과 공개 상태를 관리합니다." />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              {['수험자', '이메일', '제출 시각', '점수', '상태', '공개', '관리'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  제출된 응시 기록이 없습니다.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const published = !!entry.result?.publishedAt;
                const passed = entry.result?.status === 'PASSED';
                return (
                  <tr key={entry.attemptId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{entry.user.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.user.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {entry.submittedAt
                        ? new Date(entry.submittedAt).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">
                      {entry.result
                        ? `${entry.result.totalScore}/${entry.result.maxScore} (${entry.result.percentage.toFixed(1)}%)`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <BrandBadge variant="default" className="text-xs">
                        {attemptStatusLabels[entry.status] ?? entry.status}
                      </BrandBadge>
                      {entry.result && (
                        <BrandBadge
                          variant={passed ? 'green' : 'red'}
                          className="ml-1 text-xs"
                        >
                          {passed ? '합격' : '불합격'}
                        </BrandBadge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <BrandBadge variant={published ? 'green' : 'orange'} className="text-xs">
                        {published ? '공개됨' : '미공개'}
                      </BrandBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/exam/${id}/results/${entry.attemptId}`}
                          className="text-xs font-semibold text-brand-blue hover:underline"
                        >
                          결과 보기
                        </Link>
                        {!published && entry.result && (
                          <BrandButton
                            size="sm"
                            variant="outline"
                            loading={publishingId === entry.attemptId}
                            onClick={() => publish(entry.attemptId)}
                          >
                            결과 공개
                          </BrandButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
