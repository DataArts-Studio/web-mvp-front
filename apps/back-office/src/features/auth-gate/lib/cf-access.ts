import { headers } from 'next/headers';

import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access 신원 확인.
 *
 * CF Access 는 엣지에서 인증을 마친 뒤 요청에 다음 헤더를 주입한다:
 * - `Cf-Access-Authenticated-User-Email`: 인증된 이메일
 * - `Cf-Access-Jwt-Assertion`: 서명된 JWT (위변조 검증용)
 *
 * `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD` 가 설정되면 JWT 를 팀 JWKS 로 검증한다(운영 권장).
 * 미설정이면 헤더만 신뢰한다(로컬·초기). CF Access 가 워커 라우트를 보호하면 헤더는 신뢰 가능.
 *
 * 반환: 인증 이메일 또는 null(헤더 없음·검증 실패).
 */

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function getCfAccessEmail(): Promise<string | null> {
  let email: string | null;
  let token: string | null;
  try {
    const h = await headers();
    email = h.get('cf-access-authenticated-user-email');
    token = h.get('cf-access-jwt-assertion');
  } catch {
    return null;
  }

  if (!email) return null;

  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;

  // 검증 미설정: 헤더 신뢰 (CF Access 가 라우트를 보호한다는 전제)
  if (!teamDomain || !aud) return email;

  if (!token) return null;
  try {
    jwks ??= createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, { audience: aud });
    return (typeof payload.email === 'string' ? payload.email : null) ?? email;
  } catch {
    return null;
  }
}
