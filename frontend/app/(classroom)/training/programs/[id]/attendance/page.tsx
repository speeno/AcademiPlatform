'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { useTrainingProgram } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDateWithDay, todayYmd } from '@/lib/calendar';
import {
  ATTENDANCE_STATUS_LABELS,
  type TrainingAttendanceStatus,
} from '@/lib/training-types';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  participantId: string;
  name: string;
  affiliation?: string | null;
  participantStatus: string;
  status: TrainingAttendanceStatus | null;
  note?: string | null;
}

const STATUS_STYLES: Record<TrainingAttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500 text-white border-emerald-500',
  LATE: 'bg-amber-500 text-white border-amber-500',
  ABSENT: 'bg-red-500 text-white border-red-500',
  EXCUSED: 'bg-slate-500 text-white border-slate-500',
};

/** 출석 탭 — 회차 선택 후 참가자별 출석 상태 토글 */
export default function ProgramAttendancePage() {
  const { program } = useTrainingProgram();
  const sessions = useMemo(() => program.sessions ?? [], [program.sessions]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // 기본 선택: 오늘 회차 → 없으면 첫 회차
  useEffect(() => {
    if (selectedSessionId || sessions.length === 0) return;
    const today = todayYmd();
    const todaySession = sessions.find((s) => s.date === today);
    setSelectedSessionId((todaySession ?? sessions[0]).id);
  }, [sessions, selectedSessionId]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const res = await apiFetchWithAuth(
        `/training/sessions/${selectedSessionId}/attendance`,
      );
      if (!res.ok) {
        setRecords([]);
        return;
      }
      const data = await parseJsonSafe<{ records: AttendanceRecord[] }>(res, {
        records: [],
      });
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const upsert = async (updates: { participantId: string; status: TrainingAttendanceStatus }[]) => {
    const res = await apiFetchWithAuth(
      `/training/sessions/${selectedSessionId}/attendance`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: updates }),
      },
    );
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      throw new Error(data.message ?? '출석 저장에 실패했습니다.');
    }
  };

  /** 단건 토글 — 낙관적 업데이트, 실패 시 롤백 */
  const handleToggle = async (
    participantId: string,
    status: TrainingAttendanceStatus,
  ) => {
    const prev = records;
    setRecords((rs) =>
      rs.map((r) => (r.participantId === participantId ? { ...r, status } : r)),
    );
    try {
      await upsert([{ participantId, status }]);
    } catch (err: any) {
      setRecords(prev);
      toast.error(err.message);
    }
  };

  const handleAllPresent = async () => {
    if (!confirm('아직 체크되지 않은 수강생을 모두 출석 처리할까요?')) return;
    const unchecked = records.filter((r) => r.status === null);
    if (unchecked.length === 0) {
      toast.info('모든 수강생이 이미 체크되었습니다.');
      return;
    }
    setSavingAll(true);
    try {
      await upsert(
        unchecked.map((r) => ({
          participantId: r.participantId,
          status: 'PRESENT' as const,
        })),
      );
      toast.success(`${unchecked.length}명이 출석 처리되었습니다.`);
      await fetchAttendance();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingAll(false);
    }
  };

  const summary = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, unchecked: 0 };
    for (const r of records) {
      if (r.status === null) counts.unchecked += 1;
      else counts[r.status] += 1;
    }
    return counts;
  }, [records]);

  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
        등록된 회차가 없습니다. 회차 탭에서 일정을 먼저 등록해주세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 회차 선택 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedSessionId(s.id)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              selectedSessionId === s.id
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {s.sessionNo}회차 · {formatKoreanDateWithDay(s.date)}
          </button>
        ))}
      </div>

      {/* 요약 + 일괄 처리 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-emerald-600">출석 {summary.PRESENT}</span>
          <span className="text-amber-600">지각 {summary.LATE}</span>
          <span className="text-red-600">결석 {summary.ABSENT}</span>
          <span className="text-slate-600">공결 {summary.EXCUSED}</span>
          <span className="text-muted-foreground">미체크 {summary.unchecked}</span>
        </div>
        <BrandButton
          variant="outline"
          size="sm"
          onClick={handleAllPresent}
          loading={savingAll}
          disabled={records.length === 0}
        >
          <CheckCheck className="h-4 w-4" /> 전체 출석 처리
        </BrandButton>
      </div>

      {/* 출석 그리드 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            등록된 수강생이 없습니다. 수강생 탭에서 먼저 등록해주세요.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {records.map((r) => (
              <li
                key={r.participantId}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                  {r.affiliation && (
                    <p className="truncate text-xs text-muted-foreground">{r.affiliation}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {(
                    Object.keys(ATTENDANCE_STATUS_LABELS) as TrainingAttendanceStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleToggle(r.participantId, status)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        r.status === status
                          ? STATUS_STYLES[status]
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {ATTENDANCE_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        출석률은 출석·지각을 출석으로 인정해 지나간 회차 기준으로 계산됩니다. 수료증이 발급된
        수강생의 출석은 수정할 수 없습니다.
      </p>
    </div>
  );
}
