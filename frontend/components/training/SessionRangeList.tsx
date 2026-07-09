'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import {
  formatKoreanDateWithDay,
  rangeFromToday,
  thisMonthRange,
  thisWeekRange,
} from '@/lib/calendar';
import { findOverlappingEventIds, programColor } from '@/lib/training-colors';
import type { CalendarSessionEvent } from '@/lib/training-types';

interface SessionRangeListProps {
  from: string;
  to: string;
  onRangeChange: (range: { from: string; to: string }) => void;
  events: CalendarSessionEvent[];
  loading?: boolean;
}

const inputClass = 'rounded-lg border border-border px-3 py-1.5 text-sm';

/** 날짜 기간별 일정 목록 인터페이스 — 기간 지정 + 프리셋 + 날짜별 그룹 목록 */
export function SessionRangeList({
  from,
  to,
  onRangeChange,
  events,
  loading,
}: SessionRangeListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarSessionEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const overlappingIds = useMemo(() => findOverlappingEventIds(events), [events]);

  const presets = [
    { label: '이번 주', range: thisWeekRange },
    { label: '이번 달', range: thisMonthRange },
    { label: '향후 30일', range: () => rangeFromToday(30) },
  ];

  return (
    <div className="space-y-4">
      {/* 기간 선택 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <input
          type="date"
          value={from}
          onChange={(e) => onRangeChange({ from: e.target.value, to })}
          className={inputClass}
        />
        <span className="text-sm text-muted-foreground">~</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onRangeChange({ from, to: e.target.value })}
          className={inputClass}
        />
        <div className="ml-auto flex gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onRangeChange(p.range())}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-brand-blue/40 hover:text-brand-blue"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜별 그룹 목록 */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          선택한 기간에 등록된 일정이 없습니다.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {formatKoreanDateWithDay(date)}
              </h3>
              <ul className="space-y-1.5">
                {dayEvents.map((ev) => {
                  const isOverlapping = overlappingIds.has(ev.id);
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/training/programs/${ev.programId}/sessions`}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card px-4 py-3 text-sm hover:border-brand-blue/40 ${
                          isOverlapping ? 'border-red-300' : 'border-border'
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${programColor(ev.programId).dot}`}
                          aria-hidden
                        />
                        <span className="inline-flex items-center gap-1.5 font-medium text-brand-blue">
                          <Clock className="h-3.5 w-3.5" />
                          {ev.startTime}–{ev.endTime}
                        </span>
                        <span className="font-medium text-foreground">{ev.programTitle}</span>
                        <span className="text-muted-foreground">
                          {ev.sessionNo}회차{ev.topic ? ` · ${ev.topic}` : ''}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {ev.location}
                          </span>
                        )}
                        {isOverlapping && (
                          <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            장소·시간 중복
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
