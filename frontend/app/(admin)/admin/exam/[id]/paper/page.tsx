'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { AutoGeneratePanel, type AutoSelectWarning } from '@/components/exam/AutoGeneratePanel';
import { QuestionPickerModal } from '@/components/exam/QuestionPickerModal';
import {
  difficultyLabels,
  type ExamQuestionSummary,
  type QuestionBankOption,
  questionTypeLabels,
} from '@/components/exam/question-authoring-types';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface Paper {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  totalPoints: number;
  items: Array<{ id: string; order: number; points: number; question: ExamQuestionSummary }>;
}

interface PaperDocument {
  id: string;
  name: string;
  url: string;
}

type PaperDescriptionPayload = {
  notes?: string;
  documents?: PaperDocument[];
};

function parsePaperDescription(raw?: string | null): { notes: string; documents: PaperDocument[] } {
  if (!raw?.trim()) return { notes: '', documents: [] };
  try {
    const parsed = JSON.parse(raw) as PaperDescriptionPayload;
    const documents = Array.isArray(parsed?.documents)
      ? parsed.documents.filter((d) => d && typeof d.name === 'string' && typeof d.url === 'string')
      : [];
    if (documents.length > 0 || typeof parsed?.notes === 'string') {
      return { notes: parsed.notes ?? '', documents };
    }
  } catch {
    // 과거 데이터(plain text)와 호환
  }
  return { notes: raw, documents: [] };
}

function serializePaperDescription(notes: string, documents: PaperDocument[]): string | null {
  const normalizedNotes = notes.trim();
  const normalizedDocs = documents.filter((d) => d.name.trim() && d.url.trim());
  if (!normalizedNotes && normalizedDocs.length === 0) return null;
  return JSON.stringify({
    notes: normalizedNotes || undefined,
    documents: normalizedDocs,
  });
}

export default function AdminExamPaperPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestionSummary[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoWarnings, setAutoWarnings] = useState<AutoSelectWarning[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paperRes, banksRes] = await Promise.all([
        apiFetchWithAuth(`/online-exam/admin/sessions/${id}/paper`),
        apiFetchWithAuth('/online-exam/admin/question-banks'),
      ]);
      if (paperRes.ok) {
        const data = await parseJsonSafe<Paper | null>(paperRes, null);
        setPaper(data);
        setTitle(data?.title ?? '');
        const parsedDesc = parsePaperDescription(data?.description ?? null);
        setNotes(parsedDesc.notes);
        setDocuments(parsedDesc.documents);
        const loadedQuestions = (data?.items ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((item) => item.question);
        setSelectedQuestions(loadedQuestions);
      } else {
        setNotes('');
        setDocuments([]);
        setSelectedQuestions([]);
      }
      if (banksRes.ok) {
        const banks = await parseJsonSafe<QuestionBankOption[]>(banksRes, []);
        const subjects = Array.from(
          new Set(
            banks
              .map((bank) => (typeof bank.subject === 'string' ? bank.subject.trim() : ''))
              .filter(Boolean),
          ),
        );
        setSubjectOptions(subjects);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPoints = useMemo(() => {
    return selectedQuestions.reduce((sum, question) => sum + question.points, 0);
  }, [selectedQuestions]);
  const selectedQuestionIds = useMemo(
    () => selectedQuestions.map((question) => question.id),
    [selectedQuestions],
  );

  const addQuestions = (questionsToAdd: ExamQuestionSummary[], warnings: AutoSelectWarning[] = []) => {
    if (warnings.length > 0) setAutoWarnings(warnings);
    if (questionsToAdd.length === 0) return;
    setSelectedQuestions((prev) => {
      const seen = new Set(prev.map((question) => question.id));
      const next = [...prev];
      for (const question of questionsToAdd) {
        if (seen.has(question.id)) continue;
        seen.add(question.id);
        next.push(question);
      }
      return next;
    });
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const savePaper = async () => {
    setSaving(true);
    try {
      const description = serializePaperDescription(notes, documents);
      const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questionIds: selectedQuestionIds,
        }),
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

  const addDocument = () => {
    const name = docName.trim();
    const url = docUrl.trim();
    if (!name || !url) {
      alert('문서명과 URL을 입력해주세요.');
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        alert('문서 URL은 http/https 형식만 허용됩니다.');
        return;
      }
    } catch {
      alert('유효한 URL을 입력해주세요.');
      return;
    }
    const document: PaperDocument = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      name,
      url,
    };
    setDocuments((prev) => [...prev, document]);
    setDocName('');
    setDocUrl('');
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const columns: DataTableColumn<ExamQuestionSummary>[] = [
    { key: 'prompt', header: '문항', cell: (q) => <span className="font-medium line-clamp-2">{q.prompt}</span> },
    { key: 'bank', header: '문제은행', cell: (q) => <span className="text-xs text-muted-foreground">{q.bank?.title ?? '-'}</span>, hideOnMobile: true },
    { key: 'type', header: '유형', cell: (q) => <BrandBadge variant="blue" className="text-xs">{questionTypeLabels[q.type] ?? q.type}</BrandBadge>, className: 'w-32' },
    { key: 'difficulty', header: '난이도', cell: (q) => <span className="text-xs">{difficultyLabels[q.difficulty ?? ''] ?? '-'}</span>, className: 'w-20' },
    { key: 'points', header: '배점', cell: (q) => q.points, className: 'w-16' },
    {
      key: 'remove',
      header: '관리',
      cell: (q) => (
        <button
          type="button"
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500"
          aria-label="문항 삭제"
          onClick={() => removeQuestion(q.id)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: 'w-16',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 뒤로
        </BrandButton>
        <PageHeader
          title="시험지 편집"
          description={`선택 문항 ${selectedQuestionIds.length}개 · 총점 ${totalPoints}점`}
          actions={
            <div className="flex gap-2">
              <BrandButton variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> 문항 추가
              </BrandButton>
              <BrandButton variant="outline" size="sm" loading={saving} onClick={savePaper}>저장</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={publishPaper}>게시</BrandButton>
            </div>
          }
        />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">시험 안내 문서</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="응시 유의사항, 제출 규칙 등 안내 문구"
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="문서명 (예: 실습 데이터셋)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="문서 URL (https://...)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <BrandButton type="button" variant="outline" size="sm" onClick={addDocument}>
              <Plus className="mr-1 h-4 w-4" />
              문서 추가
            </BrandButton>
          </div>
          {documents.length > 0 && (
            <ul className="space-y-2 rounded-lg border bg-muted/20 p-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-brand-blue underline"
                    >
                      {doc.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500"
                    aria-label="문서 삭제"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AutoGeneratePanel
        sessionId={id}
        existingQuestionIds={selectedQuestionIds}
        subjectOptions={subjectOptions}
        onAdd={addQuestions}
      />

      {autoWarnings.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-orange-900">자동 출제 일부 부족</p>
          <ul className="space-y-1 text-xs text-orange-800">
            {autoWarnings.map((warning, index) => (
              <li key={`${warning.type}-${warning.difficulty}-${index}`}>
                {questionTypeLabels[warning.type] ?? warning.type} / {difficultyLabels[warning.difficulty] ?? warning.difficulty}:{' '}
                {warning.requested}개 요청 중 {warning.selected}개 추가 (가용 {warning.available}개)
              </li>
            ))}
          </ul>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={selectedQuestions}
        rowKey={(q) => q.id}
        loading={loading}
        empty={<p>아직 시험지에 추가된 문항이 없습니다. 문항 추가 또는 자동 출제를 사용해주세요.</p>}
      />

      <QuestionPickerModal
        open={pickerOpen}
        selectedQuestionIds={selectedQuestionIds}
        onClose={() => setPickerOpen(false)}
        onAdd={addQuestions}
      />
    </div>
  );
}
