/**
 * 연습용 가짜 API 인증 (API 트랙).
 *
 * - 데모 자격증명으로 로그인하면 고정 토큰을 돌려준다.
 * - 보호된 엔드포인트는 `Authorization: Bearer <token>` 를 요구한다.
 */

export const DEMO_EMAIL = 'tester@qaground.dev';
export const DEMO_PASSWORD = 'qaground123';
export const DEMO_TOKEN = 'qaground-demo-token';

export function isAuthorized(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${DEMO_TOKEN}`;
}
