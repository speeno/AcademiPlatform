'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { apiFetchWithAuth } from '@/lib/api-client';

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

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: '객관식(단일)',
  MULTIPLE_CHOICE: '객관식(복수)',
  SHORT_TEXT: '서술형',
  FILE_SUBMISSION: '실습 파일',
};

export default function AdminExamQuestionsPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankTitle, setBankTitle] = useState('');
  const [bankQualification, setBankQualification] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('SINGLE_CHOICE');
  const [points, setPoints] = useState('1');
  const [options, setOptions] = useState('A. 보기 1\nB. 보기 2\nC. 보기 3\nD. 보기 4');
  const [correctLabels, setCorrectLabels] = useState('A');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bankRes, questionRes] = await Promise.all([
        apiFetchWithAuth('/online-exam/admin/question-banks'),
        apiFetchWithAuth('/online-exam/admin/questions'),
      ]);
      if (bankRes.ok) {
        const data = await bankRes.json();
        setBanks(data);
        setSelectedBankId((prev) => prev || data[0]?.id || '');
      }
      if (questionRes.ok) setQuestions(await questionRes.json());
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
        }),
      });
      if (res.ok) {
        setBankTitle('');
        setBankQualification('');
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
          prompt,
          points: Number(points) || 1,
          options: type === 'SHORT_TEXT' ? [] : parsedOptions,
          correctOptionLabels: correctLabels.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setPrompt('');
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(Array.isArray(err.message) ? err.message.join(', ') : err.message || '문항 저장 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Question>[] = [
    { key: 'prompt', header: '문항', cell: (q) => <span className="font-medium line-clamp-2">{q.prompt}</span> },
    { key: 'bank', header: '문제은행', cell: (q) => <span className="text-xs text-muted-foreground">{q.bank?.title ?? '-'}</span>, hideOnMobile: true },
    { key: 'type', header: '유형', cell: (q) => <BrandBadge variant="blue" className="text-xs">{typeLabels[q.type] ?? q.type}</BrandBadge>, className: 'w-28' },
    { key: 'points', header: '배점', cell: (q) => <span>{q.points}</span>, className: 'w-16' },
    { key: 'active', header: '상태', cell: (q) => <BrandBadge variant={q.isActive ? 'green' : 'default'} className="text-xs">{q.isActive ? '사용' : '중지'}</BrandBadge>, className: 'w-20' },
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
            <BrandButton size="sm" onClick={createBank} loading={saving}><Plus className="mr-1 h-4 w-4" /> 생성</BrandButton>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-bold">문항 등록</h2>
          <div className="space-y-3">
            <select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
              {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
              {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
    </div>
  );
}
