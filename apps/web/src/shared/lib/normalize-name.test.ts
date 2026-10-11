import { describe, expect, it } from 'vitest';

import { normalizeName, toValidName } from './normalize-name';

describe('normalizeName', () => {
  it('앞뒤 공백을 제거한다', () => {
    expect(normalizeName('  로그인  ')).toBe('로그인');
  });

  it('문자열이 아니면 빈 문자열을 돌려준다', () => {
    expect(normalizeName(undefined)).toBe('');
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(3)).toBe('');
  });
});

describe('toValidName', () => {
  it('공백만 있는 이름은 거부한다', () => {
    expect(toValidName('   ', 50)).toBeNull();
    expect(toValidName('\t\n', 50)).toBeNull();
  });

  it('최대 길이를 넘으면 거부한다', () => {
    expect(toValidName('a'.repeat(51), 50)).toBeNull();
  });

  it('공백을 제거한 길이로 최대 길이를 판단한다', () => {
    expect(toValidName(`  ${'a'.repeat(50)}  `, 50)).toBe('a'.repeat(50));
  });
});
