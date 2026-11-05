/**
 * 프로젝트 접근 토큰 쿠키 이름 규칙.
 *
 * 미들웨어(Edge)와 서버 액션이 같은 이름을 만들도록 런타임 의존성 없는 순수 함수로 둔다.
 * 이름의 UTF-8 바이트를 base64url 로 인코딩해, 한글·공백·특수문자만 다른 프로젝트끼리도
 * 쿠키 이름이 겹치지 않게 한다 (#402). 이전 규칙(영숫자 외 문자를 _ 로 치환)과 구분되도록
 * 접두어 뒤 구분자를 점으로 쓴다. 이름은 최대 50자라 인코딩해도 200자 안팎이다.
 */
export const ACCESS_COOKIE_PREFIX = 'project_access';

const NAME_SEPARATOR = '.';

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** 프로젝트 이름으로 접근 토큰 쿠키 이름을 만든다. */
export const getAccessTokenCookieName = (projectName: string): string =>
  `${ACCESS_COOKIE_PREFIX}${NAME_SEPARATOR}${toBase64Url(projectName)}`;

/** 접근 토큰 쿠키인지 확인한다. */
export const isAccessTokenCookieName = (cookieName: string): boolean =>
  cookieName.startsWith(`${ACCESS_COOKIE_PREFIX}${NAME_SEPARATOR}`);
