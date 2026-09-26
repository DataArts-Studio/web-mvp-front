import { headers } from 'next/headers';

import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access 신원 확인.
 *
 * CF Access 는 엣지에서 인증을 마친 뒤 요청에 `Cf-Access-Jwt-Assertion`(서명된 JWT)을 주입한다.
 * 이 JWT 를 팀 JWKS 로 검증해 이메일을 얻는다.
 *
 * fail-closed: `CF_ACCESS_TEAM_DOMAIN`·`CF_ACCESS_AUD` 가 설정되지 않았으면 CF Access 경로를
 * 아예 쓰지 않는다(null). 이메일 헤더(`Cf-Access-Authenticated-User-Email`)만으로는 절대 인증하지
 * 않는다. CF Access 가 라우트 앞에 없는 환경에서 누구나 헤더를 붙여 인증을 우회하고 행위자를
 * 위조할 수 있기 때문이다. 이메일도 헤더가 아니라 검증된 JWT 페이로드에서만 읽는다.
 *
 * 반환: 검증된 이메일 또는 null(미설정·토큰 없음·검증 실패).
 */

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function getCfAccessEmail(): Promise<string | null> {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  if (!teamDomain || !aud) return null;

  let token: string | null;
  try {
    token = (await headers()).get('cf-access-jwt-assertion');
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    jwks ??= createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      audience: aud,
      issuer: `https://${teamDomain}`,
    });
    return typeof payload.email === 'string' && payload.email ? payload.email : null;
  } catch {
    return null;
  }
}
