// 월 달력 그리드용 순수 날짜 헬퍼 (라이브러리 없음, 로컬 타임존 기준)

const pad = (n: number) => String(n).padStart(2, '0');

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayYmd(): string {
  return toYmd(new Date());
}

/** 'YYYY-MM' → 이번 달 그리드. 일요일 시작, 앞뒤 달 날짜로 패딩된 주(7일) 배열 */
export function monthGrid(month: string): string[][] {
  const [year, mon] = month.split('-').map(Number);
  const first = new Date(year, mon - 1, 1);
  const start = new Date(year, mon - 1, 1 - first.getDay());
  const weeks: string[][] = [];
  const cursor = new Date(start);
  // 이번 달 마지막 날이 포함될 때까지 주 단위로 채운다 (5~6주)
  const lastDay = new Date(year, mon, 0);
  while (cursor <= lastDay || weeks.length === 0 || cursor.getDay() !== 0) {
    if (cursor.getDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push(toYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (weeks.length > 6) break;
  }
  return weeks.filter((w) => w.length === 7);
}

/** 'YYYY-MM' + delta개월 */
export function addMonths(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function currentMonth(): string {
  return todayYmd().slice(0, 7);
}

export function isSameMonth(ymd: string, month: string): boolean {
  return ymd.slice(0, 7) === month;
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return `${year}년 ${mon}월`;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function dayOfWeekName(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

/** '2026-07-15' → '7월 15일 (수)' */
export function formatKoreanDateWithDay(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${m}월 ${d}일 (${dayOfWeekName(ymd)})`;
}

/** '2026-07-15' → '2026. 7. 15.' */
export function formatKoreanDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${y}. ${m}. ${d}.`;
}

/** 월 그리드 조회 범위: 그리드에 보이는 첫날~마지막날 */
export function monthGridRange(month: string): { from: string; to: string } {
  const grid = monthGrid(month);
  return { from: grid[0][0], to: grid[grid.length - 1][6] };
}

/** 오늘부터 n일 후까지 */
export function rangeFromToday(days: number): { from: string; to: string } {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days);
  return { from: toYmd(from), to: toYmd(to) };
}

/** 이번 주(일~토) */
export function thisWeekRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - now.getDay());
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  return { from: toYmd(from), to: toYmd(to) };
}

/** 이번 달(1일~말일) */
export function thisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toYmd(from), to: toYmd(to) };
}
