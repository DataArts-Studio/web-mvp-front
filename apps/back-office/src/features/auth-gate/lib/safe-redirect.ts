/** 게이트 로그인 후 기본 이동 경로. */
export const DEFAULT_REDIRECT = '/notices';

// 실제 오리진과 무관한 기준값. 상대 경로를 해석했을 때 오리진이 바뀌는지만 본다.
const BASE = 'http://backoffice.invalid';

/**
 * open redirect 차단: 같은 오리진의 내부 경로만 돌려주고, 아니면 기본 경로로 대체한다.
 *
 * `startsWith('/') && !startsWith('//')` 만으로는 부족하다. 브라우저는 `/\evil.com` 의
 * 백슬래시를 슬래시로 바꿔 `//evil.com` 으로 해석하고, 탭·개행은 URL 파싱 중에 지운다.
 * 그래서 백슬래시와 제어문자를 거부한 뒤, 마지막으로 URL 로 해석해 오리진이 그대로인지 확인한다.
 */
export function safeRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return DEFAULT_REDIRECT;
  if (raw.startsWith('//') || raw.includes('\\')) return DEFAULT_REDIRECT;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return DEFAULT_REDIRECT;
  }

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return DEFAULT_REDIRECT;
  }
  if (url.origin !== BASE) return DEFAULT_REDIRECT;
  return `${url.pathname}${url.search}${url.hash}`;
}
