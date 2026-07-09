'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { apiFetch, parseJsonSafe } from '@/lib/api-client';
import {
  addMonths,
  currentMonth,
  formatMonthLabel,
  isSameMonth,
  monthGrid,
  monthGridRange,
  todayYmd,
} from '@/lib/calendar';
import { programColor } from '@/lib/training-colors';
import type { PublicScheduleEvent } from '@/lib/training-types';
import { cn } from '@/lib/utils';

const MAX_LIST_ITEMS = 6;

interface PublicScheduleWidgetProps {
  /** true(기본)면 공개 일정이 없을 때 섹션 자체를 숨긴다. 게시용 독립 페이지에서는 false */
  hideWhenEmpty?: boolean;
  /** 과정 상세 링크 프리픽스. 게시용 격리 페이지에서는 '/schedule/plan' 을 넘겨
      같은 영역 안에서만 이동하게 한다. (기본: 사이트 공개 페이지 '/training-plan') */
  planHrefBase?: string;
}

/**
 * 공개 교육 일정 위젯 — 작은 달력 + 일정 목록.
 * 게시(공유)된 강의 계획의 회차만 노출한다. 메인 페이지와 게시용 독립 페이지(/schedule)에서 사용.
 */
export function PublicScheduleWidget({
  hideWhenEmpty = true,
  planHrefBase = '/training-plan',
}: PublicScheduleWidgetProps) {
  const [month, setMonth] = useState(currentMonth());
  const [events, setEvents] = useState<PublicScheduleEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { from, to } = monthGridRange(month);
      try {
        const res = await apiFetch(`/training/plans/schedule?from=${from}&to=${to}`);
        if (!active) return;
        if (res.ok) {
          const data = await parseJsonSafe<{ sessions: PublicScheduleEvent[] }>(res, {
            sessions: [],
          });
          setEvents(data.sessions);
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [month]);

  const weeks = useMemo(() => monthGrid(month), [month]);
  const today = todayYmd();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PublicScheduleEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  // 목록: 선택한 날짜가 있으면 그 날, 없으면 (이번 달이면 오늘 이후) 표시 월의 일정
  const listEvents = useMemo(() => {
    if (selectedDate) return eventsByDate.get(selectedDate) ?? [];
    const inMonth = events.filter((ev) => isSameMonth(ev.date, month));
    return month === currentMonth() ? inMonth.filter((ev) => ev.date >= today) : inMonth;
  }, [events, eventsByDate, selectedDate, month, today]);

  // 공개된 일정이 하나도 없으면 섹션 숨김 (다른 달 탐색 중에는 유지)
  if (
    hideWhenEmpty &&
    loaded &&
    events.length === 0 &&
    month === currentMonth() &&
    !selectedDate
  ) {
    return null;
  }

  return (
    <section className="border-y border-border bg-white py-16 md:py-20">
      <PageShell size="wide" flush>
        <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-3xl font-extrabold text-brand-blue">
              <CalendarDays className="h-7 w-7" /> 교육 일정
            </h2>
            <p className="text-caption mt-1">현재 진행·예정 중인 교육 일정을 확인하세요</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* 작은 달력 */}
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {formatMonthLabel(month)}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMonth(addMonths(month, -1));
                    setSelectedDate(null);
                  }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonth(addMonths(month, 1));
                    setSelectedDate(null);
                  }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="다음 달"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div
                  key={d}
                  className={cn('py-1', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {weeks.flat().map((ymd) => {
                const inMonth = isSameMonth(ymd, month);
                const dayEvents = eventsByDate.get(ymd) ?? [];
                const hasEvents = dayEvents.length > 0;
                const selected = selectedDate === ymd;
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={!hasEvents}
                    onClick={() => setSelectedDate(selected ? null : ymd)}
                    className={cn(
                      'flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors',
                      !inMonth && 'text-muted-foreground/40',
                      hasEvents && 'cursor-pointer hover:bg-muted',
                      selected && 'bg-brand-blue-subtle ring-1 ring-inset ring-brand-blue/40',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded-full',
                        ymd === today && 'bg-brand-blue font-semibold text-white',
                      )}
                    >
                      {Number(ymd.slice(8, 10))}
                    </span>
                    <span className="flex h-1.5 gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            programColor(ev.programId).dot,
                          )}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 일정 목록 */}
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {selectedDate
                ? `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일 일정`
                : month === currentMonth()
                  ? '다가오는 일정'
                  : `${formatMonthLabel(month)} 일정`}
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="ml-2 text-xs font-normal text-muted-foreground underline hover:text-foreground"
                >
                  전체 보기
                </button>
              )}
            </p>
            {listEvents.length === 0 ? (
              <p className="rounded-xl border border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                표시할 교육 일정이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {listEvents.slice(0, MAX_LIST_ITEMS).map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`${planHrefBase}/${ev.shareToken}`}
                      className="group flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-brand-blue/40"
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 shrink-0 rounded-full',
                          programColor(ev.programId).dot,
                        )}
                        aria-hidden
                      />
                      <span className="w-24 shrink-0 font-medium text-foreground">
                        {Number(ev.date.slice(5, 7))}/{Number(ev.date.slice(8, 10))}
                        <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {ev.startTime}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-brand-blue">
                        {ev.programTitle}
                        {ev.topic && (
                          <span className="ml-2 font-normal text-muted-foreground">
                            {ev.topic}
                          </span>
                        )}
                      </span>
                      {ev.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
                {listEvents.length > MAX_LIST_ITEMS && (
                  <li className="px-1 text-xs text-muted-foreground">
                    외 {listEvents.length - MAX_LIST_ITEMS}건 — 달력에서 날짜를 선택해 확인하세요
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </PageShell>
    </section>
  );
}
