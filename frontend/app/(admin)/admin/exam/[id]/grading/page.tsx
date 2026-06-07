'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface GradingAnswer {
  id: string;
  textAnswer?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  pointsSnapshot: number;
  question: { prompt: string };
}

interface GradingAttempt {
  id: string;
  submittedAt?: string | null;
  user: { name: string; email: string };
  answers: GradingAnswer[];
}

export default function AdminExamGradingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempts, setAttempts] = useState<GradingAttempt[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/grading`);
    if (res.ok) {
      const data = await parseJsonSafe<GradingAttempt[]>(res, []);
      setAttempts(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const grade = async (answer: GradingAnswer) => {
    setSavingId(answer.id);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/answers/${answer.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: Number(scores[answer.id] ?? 0) }),
      });
      if (res.ok) await load();
      else alert('채점 저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const publish = async (attemptId: string) => {
    if (!confirm('결과를 공개하고 이메일을 발송할까요?')) return;
    const finalizeRes = await apiFetchWithAuth(`/online-exam/admin/attempts/${attemptId}/finalize`, { method: 'POST' });
    if (!finalizeRes.ok) {
      alert('결과 확정에 실패했습니다.');
      return;
    }
    const res = await apiFetchWithAuth(`/online-exam/admin/attempts/${attemptId}/publish-result`, { method: 'POST' });
    if (res.ok) {
      alert('결과가 공개되고 이메일 발송이 요청되었습니다.');
      await load();
    } else {
      alert('결과 공개에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 뒤로
        </BrandButton>
        <PageHeader title="서술형 채점" description="자동채점 이후 남은 서술형 답안을 채점합니다." />
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-muted-foreground">
          채점 대기 답안이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-xl border bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{attempt.user.name}</p>
                  <p className="text-xs text-muted-foreground">{attempt.user.email}</p>
                </div>
                <BrandButton variant="primary" size="sm" onClick={() => publish(attempt.id)}>
                  결과 확정/공개
                </BrandButton>
              </div>
              <div className="space-y-4">
                {attempt.answers.map((answer) => (
                  <div key={answer.id} className="rounded-lg border p-4">
                    <BrandBadge variant="blue" className="mb-2">배점 {answer.pointsSnapshot}</BrandBadge>
                    <p className="mb-2 font-medium whitespace-pre-line">{answer.question.prompt}</p>
                    <div className="mb-3 rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-line">
                      {answer.fileUrl ? (
                        <a href={answer.fileUrl} target="_blank" className="text-brand-blue underline">
                          {answer.fileName || answer.fileUrl}
                        </a>
                      ) : (
                        answer.textAnswer || '(답안 없음)'
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={answer.pointsSnapshot}
                        value={scores[answer.id] ?? ''}
                        onChange={(e) => setScores((prev) => ({ ...prev, [answer.id]: e.target.value }))}
                        placeholder={`0-${answer.pointsSnapshot}`}
                        className="w-28 rounded-lg border px-3 py-2 text-sm"
                      />
                      <BrandButton size="sm" loading={savingId === answer.id} onClick={() => grade(answer)}>
                        점수 저장
                      </BrandButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
