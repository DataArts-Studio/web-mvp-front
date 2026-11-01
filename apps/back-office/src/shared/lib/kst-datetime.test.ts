import { afterEach, describe, expect, it } from 'vitest';

import { isoToKstInput, kstInputToIso, toKstParts } from './kst-datetime';

const ORIGINAL_TZ = process.env.TZ;

describe.each(['UTC', 'America/Los_Angeles', 'Asia/Seoul'])('실행 환경 시간대 %s', (tz) => {
  afterEach(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  it('KST 10:00 입력을 01:00Z 로 저장한다', () => {
    process.env.TZ = tz;
    expect(kstInputToIso('2026-10-27T10:00')).toBe('2026-10-27T01:00:00.000Z');
  });

  it('KST 자정 직후 입력은 UTC 전날로 저장한다', () => {
    process.env.TZ = tz;
    expect(kstInputToIso('2026-11-01T00:30')).toBe('2026-10-31T15:30:00.000Z');
  });

  it('저장된 값을 KST 입력값으로 되돌린다', () => {
    process.env.TZ = tz;
    expect(isoToKstInput('2026-10-27T01:00:00.000Z')).toBe('2026-10-27T10:00');
    expect(isoToKstInput('2026-10-31T15:30:00.000Z')).toBe('2026-11-01T00:30');
  });

  it('KST 기준으로 시각을 나눈다', () => {
    process.env.TZ = tz;
    expect(toKstParts('2026-12-31T15:05:09.000Z')).toEqual({
      year: 2027,
      month: 1,
      day: 1,
      hour: 0,
      minute: 5,
      second: 9,
    });
  });
});

describe('잘못된 값', () => {
  it('형식이 다른 입력은 null', () => {
    expect(kstInputToIso('')).toBeNull();
    expect(kstInputToIso('2026-10-27')).toBeNull();
    expect(kstInputToIso('2026-10-27T10:00Z')).toBeNull();
    expect(kstInputToIso('2026-13-40T10:00')).toBeNull();
  });

  it('비어 있거나 해석할 수 없는 ISO 는 빈 입력값', () => {
    expect(isoToKstInput(null)).toBe('');
    expect(isoToKstInput('not-a-date')).toBe('');
    expect(toKstParts('not-a-date')).toBeNull();
  });
});
