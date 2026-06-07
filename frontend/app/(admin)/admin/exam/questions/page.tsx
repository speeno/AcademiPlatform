'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface QuestionBank {
  id: string;
  title: string;
  qualificationName?: string | null;
  subject?: string | null;
  _count?: { questions: number };
}

interface Question {
  id: string;
  bankId: string;
  type: string;
  difficulty: string;
  prompt: string;
  points: number;
  isActive: boolean;
  bank?: { title: string };
  options: Array<{ id: string; label: string; text: string }>;
  answerKeys: Array<{ optionId?: string | null; textPattern?: string | null }>;
}

type QuestionListResponse = {
  questions?: Question[];
};

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: '객관식(단일)',
  MULTIPLE_CHOICE: '객관식(복수)',
  SHORT_TEXT: '서술형',
  FILE_SUBMISSION: '실습 파일',
};

const difficultyLabels: Record<string, string> = {
  EASY: '쉬움',
  NORMAL: '보통',
  HARD: '어려움',
};

export default function AdminExamQuestionsPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankTitle, setBankTitle] = useState('');
  const [bankQualification, setBankQualification] = useState('');
  const [bankSubject, setBankSubject] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('SINGLE_CHOICE');
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [points, setPoints] = useState('1');
  const [options, setOptions] = useState('A. 보기 1\nB. 보기 2\nC. 보기 3\nD. 보기 4');
  const [correctLabels, setCorrectLabels] = useState('A');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editType, setEditType] = useState('SINGLE_CHOICE');
  const [editDifficulty, setEditDifficulty] = useState('NORMAL');
  const [editPoints, setEditPoints] = useState('1');
  const [editOptions, setEditOptions] = useState('');
  const [editCorrectLabels, setEditCorrectLabels] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bankRes, questionRes] = await Promise.all([
        apiFetchWithAuth('/online-exam/admin/question-banks'),
        apiFetchWithAuth('/online-exam/admin/questions?limit=100&isActive=true'),
      ]);
      if (bankRes.ok) {
        const data = await parseJsonSafe<QuestionBank[]>(bankRes, []);
        setBanks(data);
        setSelectedBankId((prev) => prev || data[0]?.id || '');
      }
      if (questionRes.ok) {
        const questionData = await parseJsonSafe<Question[] | QuestionListResponse>(questionRes, []);
        setQuestions(Array.isArray(questionData) ? questionData : questionData.questions ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parsedOptions = useMemo(() => {
    return options
      .split('\n')
      .map((line, index) => {
        const [labelRaw, ...rest] = line.split('.');
        const label = (labelRaw || String.fromCharCode(65 + index)).trim();
        const text = rest.join('.').trim() || line.trim();
        return { label, text, order: index };
      })
      .filter((option) => option.text);
  }, [options]);

  const parsedEditOptions = useMemo(() => {
    return editOptions
      .split('\n')
      .map((line, index) => {
        const [labelRaw, ...rest] = line.split('.');
        const label = (labelRaw || String.fromCharCode(65 + index)).trim();
        const text = rest.join('.').trim() || line.trim();
        return { label, text, order: index };
      })
      .filter((option) => option.text);
  }, [editOptions]);

  const isChoiceType = (questionType: string) =>
    questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE';

  const formatOptions = (question: Question) =>
    question.options
      .map((option) => `${option.label}. ${option.text}`)
      .join('\n');

  const formatCorrectLabels = (question: Question) => {
    const optionIdToLabel = new Map(question.options.map((option) => [option.id, option.label]));
    return question.answerKeys
      .map((answerKey) => answerKey.optionId ? optionIdToLabel.get(answerKey.optionId) : null)
      .filter(Boolean)
      .join(',');
  };

  const createBank = async () => {
    if (!bankTitle.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetchWithAuth('/online-exam/admin/question-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bankTitle,
          qualificationName: bankQualification || null,
          subject: bankSubject || null,
        }),
      });
      if (res.ok) {
        setBankTitle('');
        setBankQualification('');
        setBankSubject('');
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const createQuestion = async () => {
    if (!selectedBankId || !prompt.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetchWithAuth('/online-exam/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: selectedBankId,
          type,
          difficulty,
          prompt,
          points: Number(points) || 1,
          options: isChoiceType(type) ? parsedOptions : [],
          correctOptionLabels: correctLabels.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setPrompt('');
        await load();
      } else {
        const err = await parseJsonSafe<Record<string, unknown>>(res, {});
        alert(Array.isArray(err.message) ? err.message.join(', ') : err.message || '문항 저장 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (question: Question) => {
    setEditingQuestion(question);
    setEditPrompt(question.prompt);
    setEditType(question.type);
    setEditDifficulty(question.difficulty ?? 'NORMAL');
    setEditPoints(String(question.points ?? 1));
    setEditOptions(formatOptions(question));
    setEditCorrectLabels(formatCorrectLabels(question));
  };

  const closeEdit = () => {
    setEditingQuestion(null);
    setEditPrompt('');
    setEditType('SINGLE_CHOICE');
    setEditDifficulty('NORMAL');
    setEditPoints('1');
    setEditOptions('');
    setEditCorrectLabels('');
  };

  const updateQuestion = async () => {
    if (!editingQuestion || !editPrompt.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editType,
          difficulty: editDifficulty,
          prompt: editPrompt,
          points: Number(editPoints) || 1,
          options: isChoiceType(editType) ? parsedEditOptions : [],
          correctOptionLabels: editCorrectLabels.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        closeEdit();
        await load();
      } else {
        const err = await parseJsonSafe<Record<string, unknown>>(res, {});
        alert(Array.isArray(err.message) ? err.message.join(', ') : err.message || '문항 수정 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (question: Question) => {
    if (!confirm('문항을 삭제하시겠습니까? 이미 시험지/응시 기록에서 참조될 수 있어 비활성화로 처리됩니다.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) await load();
      else alert('문항 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Question>[] = [
    { key: 'prompt', header: '문항', cell: (q) => <span className="font-medium line-clamp-2">{q.prompt}</span> },
    { key: 'bank', header: '문제은행', cell: (q) => <span className="text-xs text-muted-foreground">{q.bank?.title ?? '-'}</span>, hideOnMobile: true },
    { key: 'type', header: '유형', cell: (q) => <BrandBadge variant="blue" className="text-xs">{typeLabels[q.type] ?? q.type}</BrandBadge>, className: 'w-28' },
    { key: 'difficulty', header: '난이도', cell: (q) => <span className="text-xs text-muted-foreground">{difficultyLabels[q.difficulty] ?? q.difficulty}</span>, className: 'w-20' },
    { key: 'points', header: '배점', cell: (q) => <span>{q.points}</span>, className: 'w-16' },
    { key: 'active', header: '상태', cell: (q) => <BrandBadge variant={q.isActive ? 'green' : 'default'} className="text-xs">{q.isActive ? '사용' : '중지'}</BrandBadge>, className: 'w-20' },
    {
      key: 'actions',
      header: '관리',
      cell: (q) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-brand-blue"
            aria-label="문항 편집"
            onClick={() => openEdit(q)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500"
            aria-label="문항 삭제"
            onClick={() => deleteQuestion(q)}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="문제은행"
        description="온라인 시험용 문제와 정답키를 관리합니다."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-bold">문제은행 생성</h2>
          <div className="space-y-3">
            <input value={bankTitle} onChange={(e) => setBankTitle(e.target.value)} placeholder="문제은행 이름" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input value={bankQualification} onChange={(e) => setBankQualification(e.target.value)} placeholder="자격명(선택)" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input value={bankSubject} onChange={(e) => setBankSubject(e.target.value)} placeholder="과목명(선택) 예: 데이터 분석" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <BrandButton size="sm" onClick={createBank} loading={saving}><Plus className="mr-1 h-4 w-4" /> 생성</BrandButton>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-bold">문항 등록</h2>
          <div className="space-y-3">
            <select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.title}{bank.subject ? ` (${bank.subject})` : ''}
                </option>
              ))}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
              {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="문제 내용" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
            {type !== 'SHORT_TEXT' && type !== 'FILE_SUBMISSION' && (
              <>
                <textarea value={options} onChange={(e) => setOptions(e.target.value)} rows={4} className="w-full rounded-lg border px-3 py-2 text-sm" />
                <input value={correctLabels} onChange={(e) => setCorrectLabels(e.target.value)} placeholder="정답 라벨 예: A 또는 A,C" className="w-full rounded-lg border px-3 py-2 text-sm" />
              </>
            )}
            <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="배점" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <BrandButton size="sm" onClick={createQuestion} loading={saving}>문항 저장</BrandButton>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={questions}
        rowKey={(q) => q.id}
        loading={loading}
        empty={<p>등록된 문항이 없습니다.</p>}
      />

      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">문항 편집</h2>
                <p className="text-xs text-muted-foreground">수정 시 문항 버전이 증가하며, 삭제는 비활성화로 처리됩니다.</p>
              </div>
              <button type="button" className="rounded p-2 hover:bg-muted" onClick={closeEdit} aria-label="닫기">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
                {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="문제 내용"
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {isChoiceType(editType) && (
                <>
                  <textarea
                    value={editOptions}
                    onChange={(e) => setEditOptions(e.target.value)}
                    placeholder="A. 보기 1&#10;B. 보기 2"
                    rows={5}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    value={editCorrectLabels}
                    onChange={(e) => setEditCorrectLabels(e.target.value)}
                    placeholder="정답 라벨 예: A 또는 A,C"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </>
              )}
              <input
                type="number"
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
                placeholder="배점"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <BrandButton variant="ghost" size="sm" onClick={closeEdit}>
                취소
              </BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={updateQuestion}>
                수정 저장
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
