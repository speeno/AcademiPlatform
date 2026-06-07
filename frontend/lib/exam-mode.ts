export type ExamMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export function normalizeExamMode(mode?: string | null): ExamMode {
  const upper = (mode ?? 'OFFLINE').toUpperCase();
  if (upper === 'ONLINE' || upper === 'HYBRID') return upper;
  return 'OFFLINE';
}

export function getExamModeLabel(mode?: string | null): string {
  switch (normalizeExamMode(mode)) {
    case 'ONLINE':
      return '온라인';
    case 'HYBRID':
      return '하이브리드(온오프병행)';
    default:
      return '오프라인';
  }
}

export function getExamModeBadgeVariant(
  mode?: string | null,
): 'default' | 'blue' | 'green' {
  switch (normalizeExamMode(mode)) {
    case 'ONLINE':
      return 'blue';
    case 'HYBRID':
      return 'green';
    default:
      return 'default';
  }
}

export function getExamPlaceLabel(
  mode?: string | null,
  place?: string | null,
): string {
  const normalized = normalizeExamMode(mode);
  if (normalized === 'ONLINE') return '온라인 시험장';
  if (normalized === 'HYBRID') {
    return place ? `오프라인: ${place} / 온라인 시험장` : '온라인 시험장 / 오프라인 장소 미정';
  }
  return place ?? '장소 미정';
}
