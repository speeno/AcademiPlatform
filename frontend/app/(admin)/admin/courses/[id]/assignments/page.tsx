'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';

type AssignmentItem = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  allowResubmit: boolean;
  allowLateSubmit: boolean;
  _count?: { submissions: number };
};

type SubmissionItem = {
  id: string;
  status: string;
  textAnswer?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  feedback?: string | null;
  user?: { id: string; name: string; email: string };
  submittedAt: string;
};

export default function AdminCourseAssignmentsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const authHeader = useMemo(() => buildAuthHeader(), []);
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionItem[]>>({});
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueAt, setNewDueAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${courseId}/assignments`, {
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

  const createAssignment = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${courseId}/assignments`, {
        method: 'POST',
        headers: authHeader,
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
          dueAt: newDueAt || null,
          allowResubmit: true,
          allowLateSubmit: true,
          maxFileSizeMb: 100,
          allowedFileTypes: ['pdf', 'md', 'txt', 'zip'],
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDueAt('');
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('과제를 삭제하시겠습니까?')) return;
    const res = await fetch(`${API_BASE}/courses/admin/${courseId}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    if (res.ok) await load();
  };

  const openSubmissions = async (assignmentId: string) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    if (submissions[assignmentId]) return;
    const res = await fetch(`${API_BASE}/courses/admin/${courseId}/assignments/${assignmentId}/submissions`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setSubmissions((prev) => ({ ...prev, [assignmentId]: Array.isArray(data) ? data : [] }));
    }
  };

  const reviewSubmission = async (
    assignmentId: string,
    submissionId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
  ) => {
    const feedback = prompt('피드백(선택):') ?? '';
    const res = await fetch(`${API_BASE}/courses/admin/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`, {
      method: 'PATCH',
      headers: authHeader,
      credentials: 'include',
      body: JSON.stringify({ status, feedback }),
    });
    if (res.ok) {
      await openSubmissions(assignmentId);
      await openSubmissions(assignmentId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-brand-blue">과제 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">실시간 교육의 과제 제출/피드백을 관리합니다.</p>
        </div>
        <Link href={`/admin/courses/${courseId}`}>
          <BrandButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            강좌 편집
          </BrandButton>
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">새 과제 추가</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="과제 제목"
          />
          <input
            type="datetime-local"
            value={newDueAt}
            onChange={(e) => setNewDueAt(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end">
          <BrandButton variant="primary" size="sm" loading={creating} onClick={createAssignment}>
            <Plus className="w-4 h-4 mr-1" />
            과제 생성
          </BrandButton>
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">등록된 과제가 없습니다.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    마감: {item.dueAt ? new Date(item.dueAt).toLocaleString('ko-KR') : '미정'} · 제출 {item._count?.submissions ?? 0}건
                  </p>
                </div>
                <div className="flex gap-2">
                  <BrandButton variant="outline" size="sm" onClick={() => openSubmissions(item.id)}>
                    제출물 보기
                  </BrandButton>
                  <BrandButton variant="ghost" size="sm" onClick={() => removeAssignment(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </BrandButton>
                </div>
              </div>
              {expandedId === item.id && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  {(submissions[item.id] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">제출물이 없습니다.</p>
                  ) : (
                    (submissions[item.id] ?? []).map((s) => (
                      <div key={s.id} className="rounded border bg-white p-3 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {s.user?.name ?? '익명'} ({s.user?.email ?? '-'}) · {new Date(s.submittedAt).toLocaleString('ko-KR')} · {s.status}
                        </p>
                        {s.textAnswer && <p className="text-sm whitespace-pre-wrap">{s.textAnswer}</p>}
                        {s.fileUrl && (
                          <a className="text-xs text-brand-blue underline" href={s.fileUrl} target="_blank" rel="noreferrer">
                            {s.fileName || s.fileUrl}
                          </a>
                        )}
                        {s.feedback && <p className="text-xs text-brand-blue">피드백: {s.feedback}</p>}
                        <div className="flex gap-2 justify-end">
                          <BrandButton variant="outline" size="sm" onClick={() => reviewSubmission(item.id, s.id, 'APPROVED')}>
                            승인
                          </BrandButton>
                          <BrandButton variant="outline" size="sm" onClick={() => reviewSubmission(item.id, s.id, 'REJECTED')}>
                            반려
                          </BrandButton>
                          <BrandButton variant="ghost" size="sm" onClick={() => reviewSubmission(item.id, s.id, 'PENDING')}>
                            <Save className="w-4 h-4 mr-1" />
                            보류
                          </BrandButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
