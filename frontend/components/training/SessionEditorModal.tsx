'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import type { TrainingSession } from '@/lib/training-types';

interface SessionEditorModalProps {
  open: boolean;
  programId: string;
  /** 프로그램 기간 — date input min/max */
  minDate: string;
  maxDate: string;
  /** 수정 모드일 때 대상 회차 */
  session?: TrainingSession | null;
  defaultLocation?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2 text-sm';

export function SessionEditorModal({
  open,
  programId,
  minDate,
  maxDate,
  session,
  defaultLocation,
  onClose,
  onSaved,
}: SessionEditorModalProps) {
  const [form, setForm] = useState({
    date: '',
    startTime: '10:00',
    endTime: '12:00',
    topic: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      date: session?.date ?? '',
      startTime: session?.startTime ?? '10:00',
      endTime: session?.endTime ?? '12:00',
      topic: session?.topic ?? '',
      location: session?.location ?? defaultLocation ?? '',
    });
  }, [open, session, defaultLocation]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.endTime <= form.startTime) {
      toast.error('종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        topic: form.topic || undefined,
        location: form.location || undefined,
      });
      const res = session
        ? await apiFetchWithAuth(`/training/sessions/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body,
          })
        : await apiFetchWithAuth(`/training/programs/${programId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '회차 저장에 실패했습니다.');
      }
      toast.success(session ? '회차가 수정되었습니다.' : '회차가 추가되었습니다.');
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
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {session ? `${session.sessionNo}회차 수정` : '회차 추가'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              날짜 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              min={minDate}
              max={maxDate}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className={inputClass}
            />
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
              placeholder="예: 1장. AI 윤리 개론"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">장소</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BrandButton type="button" variant="outline" onClick={onClose}>
              취소
            </BrandButton>
            <BrandButton type="submit" variant="primary" loading={saving}>
              저장
            </BrandButton>
          </div>
        </form>
      </div>
    </div>
  );
}
