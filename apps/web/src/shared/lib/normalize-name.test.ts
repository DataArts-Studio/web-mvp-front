import { describe, expect, it } from 'vitest';

import { normalizeName, toValidName, validateName, withSuffix } from './normalize-name';

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

describe('validateName', () => {
  it('빈 이름과 길이 초과를 다른 이유로 돌려준다', () => {
    expect(validateName('  ', 5)).toEqual({ ok: false, reason: 'empty' });
    expect(validateName('abcdef', 5)).toEqual({ ok: false, reason: 'too_long' });
    expect(validateName(' abc ', 5)).toEqual({ ok: true, name: 'abc' });
  });
});

describe('withSuffix', () => {
  it('최대 길이 안이면 그대로 접미사를 붙인다', () => {
    expect(withSuffix('로그인', ' (복사)', 200)).toBe('로그인 (복사)');
  });

  it('접미사를 붙여 최대 길이를 넘으면 앞 이름을 잘라 최대 길이에 맞춘다', () => {
    const copied = withSuffix('가'.repeat(200), ' (복사)', 200);
    expect(copied).toHaveLength(200);
    expect(copied.endsWith(' (복사)')).toBe(true);
  });

  it('이모지를 반으로 자르지 않는다', () => {
    const copied = withSuffix(`${'a'.repeat(193)}😀😀`, ' (복사)', 200);
    expect(copied.length).toBeLessThanOrEqual(200);
    expect(copied).toBe(`${'a'.repeat(193)}😀 (복사)`);
  });
});
