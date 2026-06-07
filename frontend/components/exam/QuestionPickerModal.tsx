'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import {
  difficultyLabels,
  difficultyOptions,
  type ExamQuestionSummary,
  type QuestionBankOption,
  questionTypeLabels,
  questionTypeOptions,
} from './question-authoring-types';

type QuestionSearchResponse = {
  questions: ExamQuestionSummary[];
  total: number;
  page: number;
  limit: number;
};

interface QuestionPickerModalProps {
  open: boolean;
  selectedQuestionIds: string[];
  onClose: () => void;
  onAdd: (questions: ExamQuestionSummary[]) => void;
}

const PAGE_SIZE = 10;

export function QuestionPickerModal({
  open,
  selectedQuestionIds,
  onClose,
  onAdd,
}: QuestionPickerModalProps) {
  const [banks, setBanks] = useState<QuestionBankOption[]>([]);
  const [questions, setQuestions] = useState<ExamQuestionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [bankId, setBankId] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const alreadySelected = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);
  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          banks
            .map((bank) => (typeof bank.subject === 'string' ? bank.subject.trim() : ''))
            .filter(Boolean),
        ),
      ),
    [banks],
  );
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!open) return;
    const loadBanks = async () => {
      const res = await apiFetchWithAuth('/online-exam/admin/question-banks');
      if (!res.ok) return;
      const data = await parseJsonSafe<QuestionBankOption[]>(res, []);
      setBanks(Array.isArray(data) ? data : []);
    };
    void loadBanks();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          isActive: 'true',
        });
        if (keyword.trim()) params.set('q', keyword.trim());
        if (bankId) params.set('bankId', bankId);
        if (subject) params.set('subject', subject);
        if (type) params.set('type', type);
        if (difficulty) params.set('difficulty', difficulty);

        const res = await apiFetchWithAuth(`/online-exam/admin/questions?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await parseJsonSafe<QuestionSearchResponse>(res, {
          questions: [],
          total: 0,
          page,
          limit: PAGE_SIZE,
        });
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setTotal(Number(data.total ?? 0));
      } catch {
        // 요청 취소/일시 오류는 다음 검색 입력에서 복구된다.
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bankId, difficulty, keyword, open, page, subject, type]);

  useEffect(() => {
    setPage(1);
  }, [bankId, difficulty, keyword, subject, type]);

  if (!open) return null;

  const toggle = (questionId: string) => {
    if (alreadySelected.has(questionId)) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const addSelected = () => {
    const picked = questions.filter((question) => checkedIds.has(question.id));
    onAdd(picked);
    setCheckedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">문제은행에서 문항 추가</h2>
            <p className="text-xs text-muted-foreground">검색·필터로 문항을 찾은 뒤 선택한 문항만 시험지에 추가합니다.</p>
          </div>
          <button type="button" className="rounded p-2 hover:bg-muted" onClick={onClose} aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-2 border-b p-4 md:grid-cols-[2fr_1.3fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="문항 지문, 설명, 태그 검색"
              className="w-full rounded-lg border px-9 py-2 text-sm"
            />
          </label>
          <select value={bankId} onChange={(event) => setBankId(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="">전체 문제은행</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.title}{bank.subject ? ` (${bank.subject})` : ''}
              </option>
            ))}
          </select>
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="">전체 과목</option>
            {subjectOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="">전체 유형</option>
            {questionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="">전체 난이도</option>
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>총 {total.toLocaleString('ko-KR')}개 결과</span>
            <span>이미 추가된 문항은 선택할 수 없습니다.</span>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="w-12 px-3 py-2 text-left">선택</th>
                  <th className="px-3 py-2 text-left">문항</th>
                  <th className="w-36 px-3 py-2 text-left">문제은행</th>
                  <th className="w-28 px-3 py-2 text-left">유형</th>
                  <th className="w-20 px-3 py-2 text-left">난이도</th>
                  <th className="w-16 px-3 py-2 text-left">배점</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                      검색 중...
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => {
                    const disabled = alreadySelected.has(question.id);
                    return (
                      <tr key={question.id} className={disabled ? 'bg-muted/20 text-muted-foreground' : 'hover:bg-muted/20'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={checkedIds.has(question.id) || disabled}
                            disabled={disabled}
                            onChange={() => toggle(question.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="line-clamp-2 font-medium">{question.prompt}</p>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{question.bank?.title ?? '-'}</td>
                        <td className="px-3 py-2">
                          <BrandBadge variant="blue" className="text-xs">
                            {questionTypeLabels[question.type] ?? question.type}
                          </BrandBadge>
                        </td>
                        <td className="px-3 py-2 text-xs">{difficultyLabels[question.difficulty ?? ''] ?? '-'}</td>
                        <td className="px-3 py-2">{question.points}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <BrandButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              이전
            </BrandButton>
            <span className="text-xs text-muted-foreground">
              {page} / {maxPage}
            </span>
            <BrandButton variant="outline" size="sm" disabled={page >= maxPage} onClick={() => setPage((prev) => prev + 1)}>
              다음
            </BrandButton>
          </div>
          <div className="flex justify-end gap-2">
            <BrandButton variant="ghost" size="sm" onClick={onClose}>
              취소
            </BrandButton>
            <BrandButton variant="primary" size="sm" disabled={checkedIds.size === 0} onClick={addSelected}>
              선택 문항 {checkedIds.size}개 추가
            </BrandButton>
          </div>
        </div>
      </div>
    </div>
  );
}
