const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** 관리자 datetime-local 입력(한국 운영 기준)을 일관된 시각으로 파싱한다. */
export function parseAppDateTime(value: unknown): Date | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (DATETIME_LOCAL_PATTERN.test(raw)) {
    const parsed = new Date(`${raw}:00+09:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
