'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  addMonths,
  currentMonth,
  datesBetween,
  formatMonthLabel,
  isSameMonth,
  monthGrid,
  todayYmd,
} from '@/lib/calendar';
import {
  CONFLICT_COLOR,
  findOverlappingEventIds,
  programColor,
} from '@/lib/training-colors';
import type {
  CalendarProgramRange,
  CalendarSessionEvent,
} from '@/lib/training-types';

interface MonthCalendarProps {
  month: string; // 'YYYY-MM'
  onMonthChange: (month: string) => void;
  events: CalendarSessionEvent[];
  /** 프로그램별 전체 수업일 범위 — 있으면 바가 월(그리드) 경계 밖 일정까지 연결선으로 이어진다 */
  programRanges?: CalendarProgramRange[];
  onEventClick?: (event: CalendarSessionEvent) => void;
  /** 날짜(빈 영역) 드래그/클릭 선택 완료 시 — 선택된 YYYY-MM-DD 목록 전달 */
  onRangeSelect?: (dates: string[]) => void;
  loading?: boolean;
}

const DAY_HEADER_HEIGHT = 34; // 날짜 숫자 영역 높이(px)
const LANE_HEIGHT = 24; // 서브 레인 1줄 높이(px, 간격 포함)
const SEGMENT_HEIGHT = LANE_HEIGHT - 4;

interface WeekBarSegment {
  col: number;
  /** 같은 날 중복 세션은 서브 레인(세로)으로 나눠 전부 표시한다 */
  subLane: number;
  type: 'session' | 'gap';
  event?: CalendarSessionEvent;
  conflict: boolean;
}

/** 한 주(週) 안에서 하나의 프로그램이 차지하는 연결 바 */
interface WeekBar {
  programId: string;
  programTitle: string;
  startCol: number;
  endCol: number;
  /** 이 주에서 필요한 서브 레인 수(= 하루 최대 세션 수) */
  subLanes: number;
  /** 이전 바들의 서브 레인 누적 오프셋 */
  laneOffset: number;
  segments: WeekBarSegment[];
  /** 클릭/라벨용 대표 이벤트(해당 주의 첫 수업, 없으면 프로그램 첫 수업) */
  representative: CalendarSessionEvent;
  hasConflict: boolean;
}

export function MonthCalendar({
  month,
  onMonthChange,
  events,
  programRanges,
  onEventClick,
  onRangeSelect,
  loading,
}: MonthCalendarProps) {
  const weeks = useMemo(() => monthGrid(month), [month]);
  const today = todayYmd();

  // 드래그 선택 상태
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const dragging = dragStart !== null;

  const selectedDates = useMemo(
    () =>
      dragStart && dragEnd ? new Set(datesBetween(dragStart, dragEnd)) : new Set<string>(),
    [dragStart, dragEnd],
  );

  // 그리드 밖에서 마우스를 놓아도 선택이 확정되도록 window 에서 mouseup 처리
  useEffect(() => {
    if (!dragging) return;
    const finish = () => {
      if (dragStart && dragEnd && onRangeSelect) {
        onRangeSelect(datesBetween(dragStart, dragEnd));
      }
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
  }, [dragging, dragStart, dragEnd, onRangeSelect]);

  const overlappingIds = useMemo(() => findOverlappingEventIds(events), [events]);

  // 프로그램별 수업일 스팬. 기본은 화면에 보이는 이벤트 기준이며,
  // programRanges 가 주어지면 전체 수업일 범위로 넓혀 월 경계 밖 일정까지 이어 그린다.
  const programSpans = useMemo(() => {
    const spans = new Map<
      string,
      { title: string; min: string; max: string; first: CalendarSessionEvent }
    >();
    const sorted = [...events].sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
    for (const ev of sorted) {
      const span = spans.get(ev.programId);
      if (!span) {
        spans.set(ev.programId, {
          title: ev.programTitle,
          min: ev.date,
          max: ev.date,
          first: ev,
        });
      } else {
        if (ev.date > span.max) span.max = ev.date;
      }
    }
    for (const range of programRanges ?? []) {
      const existing = spans.get(range.programId);
      if (existing) {
        if (range.firstDate < existing.min) existing.min = range.firstDate;
        if (range.lastDate > existing.max) existing.max = range.lastDate;
      } else {
        // 이번 화면에는 수업일이 없지만 스팬이 걸쳐 있는 프로그램 — 연결선만 그린다.
        // 클릭/라벨용 대표 이벤트는 합성해서 만든다.
        spans.set(range.programId, {
          title: range.programTitle,
          min: range.firstDate,
          max: range.lastDate,
          first: {
            id: `range-${range.programId}`,
            programId: range.programId,
            programTitle: range.programTitle,
            programStatus: 'IN_PROGRESS',
            sessionNo: 0,
            date: range.firstDate,
            startTime: '',
            endTime: '',
          },
        });
      }
    }
    return spans;
  }, [events, programRanges]);

  // 주별 프로그램 연결 바 계산.
  // - 같은 프로그램의 회차(예: 1·3·5일)는 수업일 세그먼트 + 사이 연결선으로 이어 그린다.
  // - 같은 날 세션이 여러 개면 서브 레인으로 세로 확장해 하나도 겹치지 않게 전부 표시한다.
  const weekBars = useMemo(() => {
    return weeks.map((week) => {
      const bars: WeekBar[] = [];
      for (const [programId, span] of programSpans) {
        if (span.max < week[0] || span.min > week[6]) continue;
        const startCol = span.min <= week[0] ? 0 : week.indexOf(span.min);
        const endCol = span.max >= week[6] ? 6 : week.indexOf(span.max);
        if (startCol < 0 || endCol < 0) continue;

        const segments: WeekBarSegment[] = [];
        let weekFirst: CalendarSessionEvent | null = null;
        let hasConflict = false;
        let subLanes = 1;
        for (let col = startCol; col <= endCol; col++) {
          const ymd = week[col];
          const dayEvents = events
            .filter((ev) => ev.programId === programId && ev.date === ymd)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (dayEvents.length === 0) {
            segments.push({ col, subLane: 0, type: 'gap', conflict: false });
            continue;
          }
          if (!weekFirst) weekFirst = dayEvents[0];
          subLanes = Math.max(subLanes, dayEvents.length);
          dayEvents.forEach((ev, subLane) => {
            const conflict = overlappingIds.has(ev.id);
            if (conflict) hasConflict = true;
            segments.push({ col, subLane, type: 'session', event: ev, conflict });
          });
        }
        bars.push({
          programId,
          programTitle: span.title,
          startCol,
          endCol,
          subLanes,
          laneOffset: 0, // 아래에서 누적 계산
          segments,
          representative: weekFirst ?? span.first,
          hasConflict,
        });
      }
      bars.sort(
        (a, b) => a.startCol - b.startCol || a.programId.localeCompare(b.programId),
      );
      let offset = 0;
      for (const bar of bars) {
        bar.laneOffset = offset;
        offset += bar.subLanes;
      }
      return { bars, laneTotal: offset };
    });
  }, [weeks, programSpans, events, overlappingIds]);

  const eventTitle = (ev: CalendarSessionEvent, conflict: boolean) =>
    `${ev.programTitle} ${ev.sessionNo}회차 ${ev.startTime}–${ev.endTime}` +
    (ev.topic ? ` — ${ev.topic}` : '') +
    (ev.location ? ` @${ev.location}` : '') +
    (conflict ? ' (다른 장소 일정과 시간 중복)' : '');

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* 월 이동 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="다음 달"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-2 text-base font-semibold text-foreground">
            {formatMonthLabel(month)}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {onRangeSelect && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              빈 날짜를 클릭하거나 드래그해서 일정을 추가하세요
            </p>
          )}
          <button
            type="button"
            onClick={() => onMonthChange(currentMonth())}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div
            key={day}
            className={cn(
              'py-2',
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground',
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 주 단위 렌더링: 배경(날짜 셀 + 드래그 타깃) 위에 프로그램 바 오버레이 */}
      <div className={cn('select-none', loading && 'opacity-50')}>
        {weeks.map((week, weekIdx) => {
          const { bars, laneTotal } = weekBars[weekIdx];
          const minHeight = DAY_HEADER_HEIGHT + laneTotal * LANE_HEIGHT + 8;
          return (
            <div key={week[0]} className="relative">
              {/* 배경 날짜 셀 */}
              <div className="grid grid-cols-7">
                {week.map((ymd, col) => {
                  const inMonth = isSameMonth(ymd, month);
                  const dayNum = Number(ymd.slice(8, 10));
                  const selected = selectedDates.has(ymd);
                  return (
                    <div
                      key={ymd}
                      style={{ minHeight }}
                      onMouseDown={
                        onRangeSelect
                          ? (e) => {
                              if (e.button !== 0) return;
                              e.preventDefault();
                              setDragStart(ymd);
                              setDragEnd(ymd);
                            }
                          : undefined
                      }
                      onMouseEnter={dragging ? () => setDragEnd(ymd) : undefined}
                      className={cn(
                        'border-b border-r border-border/60 p-1.5 transition-colors last:border-r-0',
                        !inMonth && 'bg-muted/20',
                        onRangeSelect && 'cursor-pointer',
                        selected && 'bg-brand-blue/10 ring-1 ring-inset ring-brand-blue/40',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          !inMonth && 'text-muted-foreground/50',
                          inMonth && col === 0 && 'text-red-500',
                          inMonth && col === 6 && 'text-blue-500',
                          inMonth && col !== 0 && col !== 6 && 'text-foreground',
                          ymd === today && 'bg-brand-blue font-semibold text-white',
                        )}
                      >
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 프로그램 연결 바 오버레이 */}
              <div
                className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-y-1"
                style={{ top: DAY_HEADER_HEIGHT, gridAutoRows: `${SEGMENT_HEIGHT}px` }}
              >
                {bars.map((bar) => {
                  const color = programColor(bar.programId);
                  const spanLen = bar.endCol - bar.startCol + 1;
                  return (
                    <div
                      key={bar.programId}
                      // 드래그 중에는 바가 mouseenter 를 가로채지 않도록 통과시킨다
                      className={cn(
                        'relative mx-1 cursor-pointer',
                        dragging ? 'pointer-events-none' : 'pointer-events-auto',
                      )}
                      style={{
                        gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
                        gridRow: `${bar.laneOffset + 1} / span ${bar.subLanes}`,
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => onEventClick?.(bar.representative)}
                    >
                      {/* 세그먼트 그리드: 열=날짜, 행=같은 날 중복 세션 서브 레인 */}
                      <div
                        className="grid h-full"
                        style={{
                          gridTemplateColumns: `repeat(${spanLen}, 1fr)`,
                          gridTemplateRows: `repeat(${bar.subLanes}, ${SEGMENT_HEIGHT}px)`,
                          rowGap: '4px',
                        }}
                      >
                        {bar.segments.map((seg) =>
                          seg.type === 'session' && seg.event ? (
                            <button
                              key={`${seg.col}-${seg.subLane}`}
                              type="button"
                              title={eventTitle(seg.event, seg.conflict)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(seg.event!);
                              }}
                              style={{
                                gridColumnStart: seg.col - bar.startCol + 1,
                                gridRowStart: seg.subLane + 1,
                              }}
                              className={cn(
                                'overflow-hidden rounded-[5px] px-1 text-left',
                                seg.conflict ? CONFLICT_COLOR.bar : color.bar,
                              )}
                            >
                              {/* 첫 서브 레인의 텍스트는 바 라벨이 담당하고,
                                  중복 세션(2번째 레인부터)은 자기 시간을 직접 표시한다 */}
                              {seg.subLane > 0 && (
                                <span
                                  className={cn(
                                    'block truncate text-[11px] font-medium leading-5',
                                    seg.conflict ? CONFLICT_COLOR.text : color.text,
                                  )}
                                >
                                  {seg.event.startTime}
                                  {seg.event.topic ? ` ${seg.event.topic}` : ''}
                                </span>
                              )}
                            </button>
                          ) : (
                            <div
                              key={`${seg.col}-gap`}
                              title={bar.programTitle}
                              style={{
                                gridColumnStart: seg.col - bar.startCol + 1,
                                gridRowStart: 1,
                              }}
                              className="flex items-center"
                            >
                              <div className={cn('h-[3px] w-full opacity-60', color.dot)} />
                            </div>
                          ),
                        )}
                      </div>
                      {/* 바 라벨 (첫 서브 레인 위에 표시) */}
                      <span
                        className={cn(
                          'pointer-events-none absolute inset-x-1.5 truncate text-[11px] font-medium',
                          bar.hasConflict ? CONFLICT_COLOR.text : color.text,
                        )}
                        style={{ top: 0, lineHeight: `${SEGMENT_HEIGHT}px` }}
                      >
                        {[bar.representative.startTime, bar.programTitle]
                          .filter(Boolean)
                          .join(' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
