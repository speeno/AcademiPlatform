import { parseAppDateTime } from '../src/common/datetime/parse-app-datetime';

function resolveEffectiveWindowStart(session: {
  examAt: Date;
  examWindowStart: Date | null;
}) {
  const examAt = session.examAt ?? null;
  const configuredStart = session.examWindowStart ?? null;
  if (configuredStart && examAt) {
    return configuredStart.getTime() >= examAt.getTime() ? configuredStart : examAt;
  }
  return configuredStart ?? examAt;
}

describe('resolveEffectiveWindowStart', () => {
  it('응시 시작이 시험 일시보다 이르면 시험 일시를 사용한다', () => {
    const examAt = parseAppDateTime('2026-06-07T12:05')!;
    const examWindowStart = parseAppDateTime('2026-06-07T12:00')!;
    const effective = resolveEffectiveWindowStart({ examAt, examWindowStart });
    expect(effective?.toISOString()).toBe(examAt.toISOString());
  });

  it('응시 시작이 시험 일시 이후면 응시 시작을 사용한다', () => {
    const examAt = parseAppDateTime('2026-06-07T12:00')!;
    const examWindowStart = parseAppDateTime('2026-06-07T12:05')!;
    const effective = resolveEffectiveWindowStart({ examAt, examWindowStart });
    expect(effective?.toISOString()).toBe(examWindowStart.toISOString());
  });
});
