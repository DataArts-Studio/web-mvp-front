import { describe, expect, it } from 'vitest';

import { isUniqueViolation } from './db-error';

describe('isUniqueViolation', () => {
  it('드라이버 오류의 23505 를 알아본다', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('drizzle 이 cause 로 감싼 23505 를 알아본다', () => {
    expect(isUniqueViolation(new Error('query failed', { cause: { code: '23505' } }))).toBe(true);
  });

  it('다른 오류는 유니크 위반으로 보지 않는다', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation(new Error('x'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
