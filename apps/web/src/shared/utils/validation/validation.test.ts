import { isBlank } from '@/shared';
import { describe, expect, it } from 'vitest';

describe('유효성 검사 단위 테스트', () => {
  it('[isBlank] 빈 문자열이면 true', () => {
    expect(isBlank ('')).toBe(true);
  });

  it('[isBlank] 공백만 있으면 true', () => {
    expect(isBlank ('   ')).toBe(true);
  });

  it('[isBlank] 탭/줄바꿈만 있어도 true', () => {
    expect(isBlank ('\n\t')).toBe(true);
  });

  it('[isBlank] 문자가 하나라도 있으면 false', () => {
    expect(isBlank ('  hello  ')).toBe(false);
  });
});