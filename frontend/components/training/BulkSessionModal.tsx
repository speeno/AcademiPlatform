'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDateWithDay } from '@/lib/calendar';
import {
  PROGRAM_STATUS_LABELS,
  type TrainingProgram,
} from '@/lib/training-types';

interface BulkSessionModalProps {
  open: boolean;
  /** 달력에서 드래그로 선택한 날짜들(YYYY-MM-DD) */
  dates: string[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2 text-sm';

/** 달력 드래그 선택 → 프로그램을 골라 여러 날짜에 회차를 일괄 등록하는 모달 */
export function BulkSessionModal({ open, dates, onClose, onSaved }: BulkSessionModalProps) {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [programId, setProgramId] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form, setForm] = useState({ startTime: '10:00', endTime: '12:00', topic: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDates([...dates].sort());
    setForm({ startTime: '10:00', endTime: '12:00', topic: '' });
    (async () => {
      const res = await apiFetchWithAuth('/training/programs?limit=100');
      if (!res.ok) return;
      const data = await parseJsonSafe<{ programs: TrainingProgram[] }>(res, {
        programs: [],
      });
      // 종료/취소된 과정은 제외
      const usable = data.programs.filter(
        (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED',
      );
      setPrograms(usable);
      if (usable.length === 1) setProgramId(usable[0].id);
    })();
  }, [open, dates]);

  const program = useMemo(
    () => programs.find((p) => p.id === programId) ?? null,
    [programs, programId],
  );

  // 선택한 프로그램 교육 기간 안/밖 날짜 구분 — 밖 날짜는 자동 제외하고 표시만 한다
  const { validDates, invalidDates } = useMemo(() => {
    if (!program) return { validDates: selectedDates, invalidDates: [] as string[] };
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const d of selectedDates) {
      (d >= program.startDate && d <= program.endDate ? valid : invalid).push(d);
    }
    return { validDates: valid, invalidDates: invalid };
  }, [program, selectedDates]);

  if (!open) return null;

  const removeDate = (date: string) =>
    setSelectedDates((prev) => prev.filter((d) => d !== date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      toast.error('강의 계획을 선택해주세요.');
      return;
    }
    if (validDates.length === 0) {
      toast.error('선택한 날짜가 모두 교육 기간 밖입니다.');
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error('종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${programId}/sessions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: validDates,
          startTime: form.startTime,
          endTime: form.endTime,
          topic: form.topic.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '일정 등록에 실패했습니다.');
      }
      const data = await res.json();
      toast.success(`${data.sessions.length}개 회차가 등록되었습니다.`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-foreground">일정 추가</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          선택한 날짜에 같은 시간대의 회차가 일괄 등록됩니다. 같은 날짜·시간에 여러 일정을 중복
          등록할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              강의 계획 <span className="text-red-500">*</span>
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">강의 계획 선택</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.startDate} ~ {p.endDate},{' '}
                  {PROGRAM_STATUS_LABELS[p.status]})
                </option>
              ))}
            </select>
            {programs.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                등록 가능한 강의 계획이 없습니다. 먼저 강의 계획을 만들어주세요.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              선택한 날짜 ({validDates.length}일)
            </label>
            <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {selectedDates.map((d) => {
                const invalid = invalidDates.includes(d);
                return (
                  <span
                    key={d}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      invalid
                        ? 'bg-red-50 text-red-500 line-through'
                        : 'bg-brand-blue-subtle text-brand-blue'
                    }`}
                    title={invalid ? '교육 기간 밖 — 등록에서 제외됩니다' : undefined}
                  >
                    {formatKoreanDateWithDay(d)}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="opacity-60 hover:opacity-100"
                      aria-label={`${d} 제외`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            {invalidDates.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                교육 기간 밖 날짜 {invalidDates.length}일은 자동으로 제외됩니다.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">주제</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="모든 회차에 동일하게 적용 (선택)"
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <BrandButton type="button" variant="outline" onClick={onClose}>
              취소
            </BrandButton>
            <BrandButton
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!programId || validDates.length === 0}
            >
              {validDates.length}개 회차 등록
            </BrandButton>
          </div>
        </form>
      </div>
    </div>
  );
}
