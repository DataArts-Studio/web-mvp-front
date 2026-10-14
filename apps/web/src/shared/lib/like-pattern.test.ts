import { describe, expect, it } from 'vitest';

import { escapeLikePattern, toContainsPattern } from './like-pattern';

describe('escapeLikePattern', () => {
  it('와일드카드 문자와 역슬래시를 이스케이프한다', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
    expect(escapeLikePattern('로그인_')).toBe('로그인\\_');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('일반 문자는 그대로 둔다', () => {
    expect(escapeLikePattern('Testea.v2 [QA] (1)')).toBe('Testea.v2 [QA] (1)');
  });
});

describe('toContainsPattern', () => {
  it('이스케이프한 검색어 앞뒤에 %를 붙인다', () => {
    expect(toContainsPattern('_')).toBe('%\\_%');
    expect(toContainsPattern('로그인')).toBe('%로그인%');
  });
});
