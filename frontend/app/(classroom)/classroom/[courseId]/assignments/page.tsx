'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';

type MyAssignment = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  allowResubmit: boolean;
  allowLateSubmit: boolean;
  submissions?: Array<{
    id: string;
    status: string;
    submittedAt: string;
    feedback?: string | null;
    fileName?: string | null;
  }>;
};

export default function ClassroomAssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { textAnswer: string; fileUrl: string; fileName: string }>>({});

  const authHeader = useMemo(() => buildAuthHeader(), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/courses/my/courses/${courseId}/assignments`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (assignmentId: string) => {
    const draft = drafts[assignmentId] ?? { textAnswer: '', fileUrl: '', fileName: '' };
    setSubmittingId(assignmentId);
    try {
      const res = await fetch(`${API_BASE}/courses/my/assignments/${assignmentId}/submission`, {
        method: 'POST',
        headers: authHeader,
        credentials: 'include',
        body: JSON.stringify({
          textAnswer: draft.textAnswer,
          fileUrl: draft.fileUrl,
          fileName: draft.fileName,
        }),
      });
      if (res.ok) await load();
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">과제를 불러오는 중...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-brand-blue">과제 제출</h1>
          <p className="text-sm text-muted-foreground mt-1">실시간 수업에서 안내된 과제를 제출하고 피드백을 확인하세요.</p>
        </div>
        <Link href={`/classroom/${courseId}`}>
          <BrandButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            강의실로
          </BrandButton>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          등록된 과제가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const submitted = item.submissions?.[0];
            const dueText = item.dueAt ? new Date(item.dueAt).toLocaleString('ko-KR') : '기한 미정';
            const draft = drafts[item.id] ?? { textAnswer: '', fileUrl: '', fileName: '' };
            return (
              <section key={item.id} className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      마감: {dueText}
                      <span className="ml-2">재제출 {item.allowResubmit ? '허용' : '미허용'}</span>
                    </p>
                  </div>
                  {submitted && (
                    <span className="text-xs rounded-full bg-muted px-2.5 py-1">{submitted.status}</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                )}
                <textarea
                  value={draft.textAnswer}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: { ...draft, textAnswer: e.target.value } }))}
                  rows={4}
                  placeholder="텍스트 답안을 입력하세요."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <div className="grid md:grid-cols-2 gap-2">
                  <input
                    value={draft.fileUrl}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: { ...draft, fileUrl: e.target.value } }))}
                    placeholder="제출 파일 URL"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    value={draft.fileName}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: { ...draft, fileName: e.target.value } }))}
                    placeholder="파일명 (선택)"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                {submitted?.feedback && (
                  <div className="rounded-lg bg-brand-blue-subtle px-3 py-2 text-sm text-brand-blue">
                    피드백: {submitted.feedback}
                  </div>
                )}
                <div className="flex justify-end">
                  <BrandButton
                    variant="primary"
                    size="sm"
                    loading={submittingId === item.id}
                    onClick={() => submit(item.id)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    제출하기
                  </BrandButton>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
