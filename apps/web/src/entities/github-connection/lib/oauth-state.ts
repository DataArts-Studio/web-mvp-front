import crypto from 'crypto';
import 'server-only';

/**
 * GitHub OAuth state (CSRF 방지).
 *
 * 연결을 시작한 브라우저만 결과를 받도록, 서버가 난수 nonce 를 만들어 httpOnly 쿠키에 두고
 * 같은 값을 OAuth state 로 보낸다. 콜백은 쿼리의 state 와 쿠키를 대조해 일치할 때만 code 를
 * 넘긴다. 공격자가 자기 GitHub 계정으로 받은 code·state 를 피해자 브라우저에 밀어 넣어도
 * 피해자 쿠키의 nonce 와 맞지 않아 거부된다.
 *
 * 쿠키에는 프로젝트 id 도 함께 둔다. 콜백 결과의 projectId 는 쿼리가 아니라 쿠키에서 나온다.
 */

export const OAUTH_STATE_COOKIE = 'github_oauth_state';
export const OAUTH_STATE_COOKIE_PATH = '/api/auth/github';
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export function createOAuthState(projectId: string): { nonce: string; cookieValue: string } {
  const nonce = crypto.randomBytes(32).toString('base64url');
  return { nonce, cookieValue: `${nonce}.${projectId}` };
}

/**
 * 쿼리 state 와 쿠키 값을 대조한다.
 * @returns 일치하면 쿠키에 담긴 projectId, 아니면 null.
 */
export function verifyOAuthState(
  state: string | null,
  cookieValue: string | undefined
): string | null {
  if (!state || !cookieValue) return null;
  const separator = cookieValue.indexOf('.');
  if (separator <= 0) return null;
  const nonce = cookieValue.slice(0, separator);
  const projectId = cookieValue.slice(separator + 1);
  if (!projectId) return null;

  const expected = Buffer.from(nonce);
  const provided = Buffer.from(state);
  if (expected.length !== provided.length) return null;
  return crypto.timingSafeEqual(expected, provided) ? projectId : null;
}
