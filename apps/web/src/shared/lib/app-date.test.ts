import {
  formatDate,
  formatDateKR,
  formatDateTime,
  startOfAppDay,
  startOfAppMonth,
  toAppDateOnly,
} from '@testea/util';
import { describe, expect, it } from 'vitest';

// 서버(UTC) 시각으로 KST 새벽을 만든다. 2026-10-13 02:30 KST = 2026-10-12 17:30 UTC
const kstDawn = new Date('2026-10-12T17:30:00Z');

describe('서비스 시간대(Asia/Seoul) 날짜 계산', () => {
  it('KST 새벽도 당일 날짜로 계산한다', () => {
    expect(toAppDateOnly(kstDawn)).toBe('2026-10-13');
    expect(formatDate(kstDawn)).toBe('2026-10-13');
  });

  it('KST 09시 직전까지는 UTC 와 날짜가 다르다', () => {
    expect(toAppDateOnly(new Date('2026-10-13T14:59:59Z'))).toBe('2026-10-13');
    expect(toAppDateOnly(new Date('2026-10-13T15:00:00Z'))).toBe('2026-10-14');
  });

  it('날짜만 있는 값은 그 날짜 그대로 보인다', () => {
    expect(formatDate('2026-10-13')).toBe('2026-10-13');
  });

  it('하루 경계는 KST 0시다', () => {
    expect(startOfAppDay(kstDawn).toISOString()).toBe('2026-10-12T15:00:00.000Z');
  });

  it('한 달 경계는 KST 1일 0시다', () => {
    // 2026-11-01 05:00 KST
    expect(startOfAppMonth(new Date('2026-10-31T20:00:00Z')).toISOString()).toBe(
      '2026-10-31T15:00:00.000Z'
    );
  });

  it('화면 표기도 KST 날짜를 쓴다', () => {
    expect(formatDateKR(kstDawn)).toBe('2026. 10. 13.');
    expect(formatDateTime(kstDawn)).toContain('2026. 10. 13.');
  });

  it('값이 없거나 잘못되면 대체 문자열을 돌려준다', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not-a-date', '')).toBe('');
  });
});
