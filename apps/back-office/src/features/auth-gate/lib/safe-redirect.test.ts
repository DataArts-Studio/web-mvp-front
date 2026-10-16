import { describe, expect, it } from 'vitest';

import { DEFAULT_REDIRECT, safeRedirect } from './safe-redirect';

describe('게이트 로그인 후 이동 경로', () => {
  it.each([
    ['/notices', '/notices'],
    ['/notices/123/edit', '/notices/123/edit'],
    ['/logs?page=2#top', '/logs?page=2#top'],
    ['/', '/'],
  ])('내부 경로 %s 는 그대로 허용한다.', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });

  it.each([
    ['백슬래시 우회', '/\\evil.com'],
    ['백슬래시 이중', '/\\\\evil.com'],
    ['경로 중간 백슬래시', '/notices\\..\\\\evil.com'],
    ['탭 삽입', '/\t/evil.com'],
    ['개행 삽입', '/\n/evil.com'],
    ['DEL 문자', '/\u007f/evil.com'],
    ['프로토콜 상대', '//evil.com'],
    ['절대 URL', 'https://evil.com'],
    ['스킴', 'javascript:alert(1)'],
    ['상대 경로', 'notices'],
    ['빈 문자열', ''],
    ['문자열 아님', null],
  ])('%s 는 기본 경로로 대체한다.', (_label, input) => {
    expect(safeRedirect(input)).toBe(DEFAULT_REDIRECT);
  });

  it('퍼센트 인코딩된 백슬래시는 경로 문자로만 남아 외부로 나가지 않는다.', () => {
    expect(safeRedirect('/%5Cevil.com')).toBe('/%5Cevil.com');
  });
});
