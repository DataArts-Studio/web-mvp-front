import { describe, expect, it } from 'vitest';

import { getAccessTokenCookieName, isAccessTokenCookieName } from './cookie-name';

describe('getAccessTokenCookieName', () => {
  it('글자 수만 같은 한글 이름 프로젝트끼리 쿠키 이름이 겹치지 않는다', () => {
    expect(getAccessTokenCookieName('알파 테스트 01')).not.toBe(
      getAccessTokenCookieName('베타 테스트 01')
    );
    expect(getAccessTokenCookieName('[QA] 50% #1')).not.toBe(
      getAccessTokenCookieName('(QA) 50! @1')
    );
  });

  it('같은 이름은 항상 같은 쿠키 이름을 만든다', () => {
    expect(getAccessTokenCookieName('sample-project')).toBe(
      getAccessTokenCookieName('sample-project')
    );
  });

  it('쿠키 이름에 쓸 수 있는 문자만 쓴다', () => {
    const name = getAccessTokenCookieName('한글 이름 / ; = , "따옴표" 프로젝트');
    expect(name).toMatch(/^project_access\.[A-Za-z0-9_-]+$/);
  });

  it('50자 한글 이름도 쿠키 이름 길이가 적당하다', () => {
    expect(getAccessTokenCookieName('가'.repeat(50)).length).toBeLessThan(256);
  });

  it('접근 토큰 쿠키만 골라낸다(이전 규칙 쿠키는 제외)', () => {
    expect(isAccessTokenCookieName(getAccessTokenCookieName('프로젝트'))).toBe(true);
    expect(isAccessTokenCookieName('project_access_sample')).toBe(false);
    expect(isAccessTokenCookieName('other')).toBe(false);
  });
});
