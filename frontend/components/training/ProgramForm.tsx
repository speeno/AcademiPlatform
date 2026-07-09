'use client';

import { CourseSearchSelect } from './CourseSearchSelect';
import {
  PROGRAM_STATUS_LABELS,
  type TrainingProgramStatus,
} from '@/lib/training-types';

export interface ProgramFormValue {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: string; // input 값 그대로 보관, 제출 시 숫자 변환
  course: { id: string; title: string } | null;
  status: TrainingProgramStatus;
}

export const EMPTY_PROGRAM_FORM: ProgramFormValue = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  capacity: '',
  course: null,
  status: 'DRAFT',
};

interface ProgramFormProps {
  value: ProgramFormValue;
  onChange: (value: ProgramFormValue) => void;
  /** 상태 select 노출 여부 (수정 화면에서만) */
  showStatus?: boolean;
  disabled?: boolean;
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2 text-sm';

export function ProgramForm({ value, onChange, showStatus, disabled }: ProgramFormProps) {
  const set = <K extends keyof ProgramFormValue>(key: K, v: ProgramFormValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          과정명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예: 2026년 상반기 AI 자격 대비 과정"
          required
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">설명</label>
        <textarea
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="과정 소개, 대상, 준비물 등"
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            시작일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            종료일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={value.endDate}
            min={value.startDate || undefined}
            onChange={(e) => set('endDate', e.target.value)}
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">장소</label>
          <input
            type="text"
            value={value.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="예: 본원 3층 강의실"
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">정원</label>
          <input
            type="number"
            min={1}
            value={value.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            placeholder="제한 없음"
            disabled={disabled}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">연계 강좌</label>
        <CourseSearchSelect
          value={value.course}
          onChange={(course) => set('course', course)}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          플랫폼 온라인 강좌와 연계 운영하는 경우에만 선택하세요.
        </p>
      </div>

      {showStatus && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">상태</label>
          <select
            value={value.status}
            onChange={(e) => set('status', e.target.value as TrainingProgramStatus)}
            disabled={disabled}
            className={inputClass}
          >
            {(Object.keys(PROGRAM_STATUS_LABELS) as TrainingProgramStatus[]).map((s) => (
              <option key={s} value={s}>
                {PROGRAM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
