'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, List, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { MonthCalendar } from '@/components/training/MonthCalendar';
import { SessionRangeList } from '@/components/training/SessionRangeList';
import { BulkSessionModal } from '@/components/training/BulkSessionModal';
import { ProgramListPanel } from '@/components/training/ProgramListPanel';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { currentMonth, monthGridRange, thisMonthRange } from '@/lib/calendar';
import { programColor, uniquePrograms } from '@/lib/training-colors';
import type { CalendarSessionEvent } from '@/lib/training-types';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

/** 교육 운영 홈 — 달력 인터페이스 + 날짜 기간별 목록 인터페이스 */
export default function TrainingHomePage() {
  const router = useRouter();
  // 레포 컨벤션에 따라 useSearchParams 대신 window.location 을 읽는다 (Suspense 불필요)
  const [view, setViewState] = useState<ViewMode>(() =>
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('view') === 'list'
      ? 'list'
      : 'calendar',
  );

  const [month, setMonth] = useState(currentMonth());
  const [listRange, setListRange] = useState(thisMonthRange());
  const [events, setEvents] = useState<CalendarSessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // 달력 드래그 선택 → 일괄 등록 모달
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  // 일정 등록 후 강의 계획 패널(회차 수 등) 갱신 트리거
  const [programsRefreshKey, setProgramsRefreshKey] = useState(0);

  // 현재 뷰에 필요한 조회 범위
  const range = useMemo(
    () => (view === 'calendar' ? monthGridRange(month) : listRange),
    [view, month, listRange],
  );

  const fetchEvents = useCallback(async () => {
    if (!range.from || !range.to || range.from > range.to) return;
    setLoading(true);
    try {
      const res = await apiFetchWithAuth(
        `/training/calendar?from=${range.from}&to=${range.to}`,
      );
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const data = await parseJsonSafe<{ sessions: CalendarSessionEvent[] }>(res, {
        sessions: [],
      });
      setEvents(data.sessions);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const setView = (next: ViewMode) => {
    setViewState(next);
    router.replace(next === 'list' ? '/training?view=list' : '/training');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="교육 운영"
        title="교육 일정"
        description="달력에서 일정을 관리하고, 아래 강의 계획 목록에서 과정별 상세로 이동합니다."
        actions={
          <Link href="/training/programs/new">
            <BrandButton variant="primary" size="sm">
              <Plus className="h-4 w-4" /> 새 강의 계획
            </BrandButton>
          </Link>
        }
      />

      {/* 뷰 토글 */}
      <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
        {(
          [
            { key: 'calendar', label: '달력', Icon: CalendarDays },
            { key: 'list', label: '기간별 목록', Icon: List },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {view === 'calendar' ? (
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          events={events}
          loading={loading}
          onEventClick={(ev) =>
            router.push(`/training/programs/${ev.programId}/sessions`)
          }
          onRangeSelect={(dates) => {
            setBulkDates(dates);
            setBulkOpen(true);
          }}
        />
      ) : (
        <SessionRangeList
          from={listRange.from}
          to={listRange.to}
          onRangeChange={setListRange}
          events={events}
          loading={loading}
        />
      )}

      {/* 프로그램별 컬러 범례 */}
      {events.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {uniquePrograms(events).map((p) => (
            <span key={p.programId} className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${programColor(p.programId).dot}`}
                aria-hidden
              />
              {p.programTitle}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-300 ring-1 ring-inset ring-red-500" aria-hidden />
            장소가 다른 시간 중복 일정
          </span>
        </div>
      )}

      {/* 강의 계획 목록 — 달력 인터페이스에 통합 */}
      <ProgramListPanel refreshKey={programsRefreshKey} />

      <BulkSessionModal
        open={bulkOpen}
        dates={bulkDates}
        onClose={() => setBulkOpen(false)}
        onSaved={() => {
          void fetchEvents();
          setProgramsRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
