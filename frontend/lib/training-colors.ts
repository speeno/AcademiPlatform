// 프로그램별 달력 표시 컬러. programId 해시로 고정 배정되어
// 어느 화면에서 보든 같은 프로그램은 같은 색으로 표시된다.
// (Tailwind JIT 를 위해 클래스 문자열은 전부 정적으로 나열)

import type { CalendarSessionEvent } from '@/lib/training-types';

export interface ProgramColor {
  /** 달력 바의 수업일 세그먼트 배경 */
  bar: string;
  /** 바 라벨 텍스트 */
  text: string;
  /** 범례·목록용 도트 / 연결선 */
  dot: string;
}

export const PROGRAM_COLOR_PALETTE: ProgramColor[] = [
  { bar: 'bg-blue-200', text: 'text-blue-900', dot: 'bg-blue-500' },
  { bar: 'bg-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  { bar: 'bg-amber-200', text: 'text-amber-900', dot: 'bg-amber-500' },
  { bar: 'bg-purple-200', text: 'text-purple-900', dot: 'bg-purple-500' },
  { bar: 'bg-rose-200', text: 'text-rose-900', dot: 'bg-rose-500' },
  { bar: 'bg-cyan-200', text: 'text-cyan-900', dot: 'bg-cyan-500' },
  { bar: 'bg-lime-200', text: 'text-lime-900', dot: 'bg-lime-600' },
  { bar: 'bg-indigo-200', text: 'text-indigo-900', dot: 'bg-indigo-500' },
  { bar: 'bg-orange-200', text: 'text-orange-900', dot: 'bg-orange-500' },
  { bar: 'bg-teal-200', text: 'text-teal-900', dot: 'bg-teal-500' },
];

/** 장소가 다른데 시간이 겹치는(운영 불가능한 충돌) 세그먼트 표시용 */
export const CONFLICT_COLOR: ProgramColor = {
  bar: 'bg-red-300 ring-1 ring-inset ring-red-500',
  text: 'text-red-900',
  dot: 'bg-red-500',
};

export function programColor(programId: string): ProgramColor {
  let hash = 0;
  for (let i = 0; i < programId.length; i++) {
    hash = (hash * 31 + programId.charCodeAt(i)) >>> 0;
  }
  return PROGRAM_COLOR_PALETTE[hash % PROGRAM_COLOR_PALETTE.length];
}

/**
 * 충돌(색 변경 대상) 이벤트 id 집합.
 * 같은 날짜에서 시간대가 겹치더라도 장소가 같으면 병행 수업으로 간주해 제외하고,
 * "장소가 다른데 시간이 겹치는" 경우만 충돌로 표시한다.
 */
export function findOverlappingEventIds(events: CalendarSessionEvent[]): Set<string> {
  const overlapping = new Set<string>();
  const byDate = new Map<string, CalendarSessionEvent[]>();
  for (const ev of events) {
    const list = byDate.get(ev.date) ?? [];
    list.push(ev);
    byDate.set(ev.date, list);
  }
  const loc = (ev: CalendarSessionEvent) => (ev.location ?? '').trim();
  for (const dayEvents of byDate.values()) {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i];
        const b = dayEvents[j];
        if (loc(a) === loc(b)) continue; // 같은 장소 → 충돌 아님
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          overlapping.add(a.id);
          overlapping.add(b.id);
        }
      }
    }
  }
  return overlapping;
}

/** 범례용: 이벤트 목록에서 프로그램 (id, title) 유니크 추출 */
export function uniquePrograms(
  events: CalendarSessionEvent[],
): { programId: string; programTitle: string }[] {
  const seen = new Map<string, string>();
  for (const ev of events) {
    if (!seen.has(ev.programId)) seen.set(ev.programId, ev.programTitle);
  }
  return [...seen.entries()].map(([programId, programTitle]) => ({
    programId,
    programTitle,
  }));
}
