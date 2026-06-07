'use client';

import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import {
  difficultyLabels,
  difficultyOptions,
  type ExamQuestionSummary,
  questionTypeLabels,
  questionTypeOptions,
} from './question-authoring-types';

type AutoRule = {
  id: string;
  type: string;
  difficulty: string;
  subject: string;
  count: string;
};

export type AutoSelectWarning = {
  type: string;
  difficulty: string;
  requested: number;
  selected: number;
  available: number;
};

type AutoSelectResponse = {
  selectedQuestions: ExamQuestionSummary[];
  warnings: AutoSelectWarning[];
};

interface AutoGeneratePanelProps {
  sessionId: string;
  existingQuestionIds: string[];
  subjectOptions?: string[];
  onAdd: (questions: ExamQuestionSummary[], warnings: AutoSelectWarning[]) => void;
}

function createRule(): AutoRule {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    type: 'SINGLE_CHOICE',
    difficulty: 'NORMAL',
    subject: '',
    count: '5',
  };
}

export function AutoGeneratePanel({
  sessionId,
  existingQuestionIds,
  subjectOptions = [],
  onAdd,
}: AutoGeneratePanelProps) {
  const [rules, setRules] = useState<AutoRule[]>([createRule()]);
  const [loading, setLoading] = useState(false);

  const updateRule = (ruleId: string, patch: Partial<AutoRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (ruleId: string) => {
    setRules((prev) => (prev.length <= 1 ? prev : prev.filter((rule) => rule.id !== ruleId)));
  };

  const runAutoSelect = async () => {
    const normalizedRules = rules
      .map((rule) => ({
        type: rule.type,
        difficulty: rule.difficulty,
        subject: rule.subject || undefined,
        count: Number(rule.count),
      }))
      .filter((rule) => rule.type && rule.difficulty && Number.isFinite(rule.count) && rule.count > 0);
    if (normalizedRules.length === 0) {
      alert('자동 출제 규칙을 1개 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${sessionId}/paper/auto-select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: normalizedRules,
          excludeQuestionIds: existingQuestionIds,
        }),
      });
      const data = await parseJsonSafe<AutoSelectResponse>(res, { selectedQuestions: [], warnings: [] });
      if (!res.ok) {
        alert('자동 출제에 실패했습니다.');
        return;
      }
      onAdd(Array.isArray(data.selectedQuestions) ? data.selectedQuestions : [], data.warnings ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">난이도·종류별 자동 출제</p>
          <p className="text-xs text-muted-foreground">
            전체 문제은행에서 활성 문항을 자동으로 선택합니다. 부족한 규칙은 가능한 만큼 추가됩니다.
          </p>
        </div>
        <BrandButton variant="outline" size="sm" onClick={() => setRules((prev) => [...prev, createRule()])}>
          <Plus className="mr-1 h-4 w-4" />
          규칙 추가
        </BrandButton>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="grid gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_1fr_120px_auto]">
            <select
              value={rule.type}
              onChange={(event) => updateRule(rule.id, { type: event.target.value })}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              {questionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={rule.difficulty}
              onChange={(event) => updateRule(rule.id, { difficulty: event.target.value })}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={rule.subject}
              onChange={(event) => updateRule(rule.id, { subject: event.target.value })}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="">전체 과목</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={rule.count}
              onChange={(event) => updateRule(rule.id, { count: event.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="문항 수"
            />
            <button
              type="button"
              className="rounded p-2 text-muted-foreground hover:bg-white hover:text-red-500"
              onClick={() => removeRule(rule.id)}
              aria-label={`${questionTypeLabels[rule.type] ?? rule.type} ${difficultyLabels[rule.difficulty] ?? rule.difficulty} 규칙 삭제`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <BrandButton variant="primary" size="sm" loading={loading} onClick={runAutoSelect}>
          <Wand2 className="mr-1 h-4 w-4" />
          자동 출제
        </BrandButton>
      </div>
    </div>
  );
}
