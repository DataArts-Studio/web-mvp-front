import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isDateRangeOrdered,
  isValidDateOnly,
  normalizeDateOnly,
  toDateOnly,
  todayDateOnly,
} from './date-only';

describe('date-only', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('로컬 자정 Date 를 그 날짜 그대로 만든다 (UTC 로 바꾸지 않음)', () => {
    expect(toDateOnly(new Date(2026, 9, 1))).toBe('2026-10-01');
  });

  it('오늘 날짜는 로컬 시간대 기준이다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 0, 30));
    expect(todayDateOnly()).toBe('2026-10-11');
  });

  it('존재하지 않는 날짜와 다른 형식을 거부한다', () => {
    expect(isValidDateOnly('2026-10-01')).toBe(true);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2026-1-1')).toBe(false);
    expect(isValidDateOnly('2026-10-01T00:00')).toBe(false);
  });

  it('DB 값과 ISO 문자열을 날짜만 남긴다', () => {
    expect(normalizeDateOnly('2026-10-01')).toBe('2026-10-01');
    expect(normalizeDateOnly('2026-09-30T15:00:00.000Z')).toBe('2026-09-30');
    expect(normalizeDateOnly(null)).toBeNull();
    expect(normalizeDateOnly('nope')).toBeNull();
  });

  it('종료일이 시작일보다 빠를 때만 순서가 틀렸다고 본다', () => {
    expect(isDateRangeOrdered('2026-10-01', '2026-10-01')).toBe(true);
    expect(isDateRangeOrdered('2026-10-01', '2026-10-02')).toBe(true);
    expect(isDateRangeOrdered('2026-10-02', '2026-10-01')).toBe(false);
    expect(isDateRangeOrdered(null, '2026-10-01')).toBe(true);
    expect(isDateRangeOrdered('2026-10-01', undefined)).toBe(true);
  });
});
