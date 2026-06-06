'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth } from '@/lib/api-client';

interface Question {
  id: string;
  prompt: string;
  type: string;
  points: number;
  bank?: { title: string };
}

interface Paper {
  id: string;
  title: string;
  status: string;
  totalPoints: number;
  items: Array<{ id: string; order: number; points: number; question: Question }>;
}

export default function AdminExamPaperPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [questionRes, paperRes] = await Promise.all([
        apiFetchWithAuth('/online-exam/admin/questions'),
        apiFetchWithAuth(`/online-exam/admin/sessions/${id}/paper`),
      ]);
      if (questionRes.ok) setQuestions(await questionRes.json());
      if (paperRes.ok) {
        const data = await paperRes.json();
        setPaper(data);
        setTitle(data?.title ?? '');
        setSelected(new Set((data?.items ?? []).map((item: any) => item.question.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const totalPoints = useMemo(() => {
    return questions
      .filter((q) => selected.has(q.id))
      .reduce((sum, q) => sum + q.points, 0);
  }, [questions, selected]);

  const toggleQuestion = (questionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const savePaper = async () => {
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questionIds: Array.from(selected) }),
      });
      if (res.ok) await load();
      else alert('시험지 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const publishPaper = async () => {
    if (!confirm('시험지를 게시하면 응시자가 이 구성으로 시험을 시작할 수 있습니다. 게시할까요?')) return;
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/paper/publish`, {
        method: 'POST',
      });
      if (res.ok) await load();
      else alert('시험지 게시에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Question>[] = [
    {
      key: 'select',
      header: '',
      cell: (q) => (
        <input
          type="checkbox"
          checked={selected.has(q.id)}
          onChange={() => toggleQuestion(q.id)}
        />
      ),
      className: 'w-10',
    },
    { key: 'prompt', header: '문항', cell: (q) => <span className="font-medium line-clamp-2">{q.prompt}</span> },
    { key: 'bank', header: '문제은행', cell: (q) => <span className="text-xs text-muted-foreground">{q.bank?.title ?? '-'}</span>, hideOnMobile: true },
    { key: 'type', header: '유형', cell: (q) => <BrandBadge variant="blue" className="text-xs">{q.type}</BrandBadge>, className: 'w-32' },
    { key: 'points', header: '배점', cell: (q) => q.points, className: 'w-16' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 뒤로
        </BrandButton>
        <PageHeader
          title="시험지 편집"
          description={`선택 문항 ${selected.size}개 · 총점 ${totalPoints}점`}
          actions={
            <div className="flex gap-2">
              <BrandButton variant="outline" size="sm" loading={saving} onClick={savePaper}>저장</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={publishPaper}>게시</BrandButton>
            </div>
          }
        />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="시험지 제목"
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          {paper && (
            <BrandBadge variant={paper.status === 'PUBLISHED' ? 'green' : 'default'}>
              {paper.status}
            </BrandBadge>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={questions}
        rowKey={(q) => q.id}
        loading={loading}
        empty={<p>문제은행에 문항이 없습니다.</p>}
      />
    </div>
  );
}
