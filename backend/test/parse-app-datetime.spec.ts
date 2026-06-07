import { parseAppDateTime } from '../src/common/datetime/parse-app-datetime';

describe('parseAppDateTime', () => {
  it('datetime-local 입력을 KST(+09:00) 기준으로 파싱한다', () => {
    const parsed = parseAppDateTime('2026-06-07T11:00');
    expect(parsed?.toISOString()).toBe('2026-06-07T02:00:00.000Z');
  });

  it('ISO 문자열은 그대로 파싱한다', () => {
    const parsed = parseAppDateTime('2026-06-07T02:00:00.000Z');
    expect(parsed?.toISOString()).toBe('2026-06-07T02:00:00.000Z');
  });
});
