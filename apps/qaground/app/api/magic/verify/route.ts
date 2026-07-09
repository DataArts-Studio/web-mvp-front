import { NextResponse } from 'next/server';

import { setBetaAccessCookie } from '@/shared/magic-link/cookie';
import { verifyMagicToken } from '@/shared/magic-link/token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 매직링크 검증 진입점. 이메일로 받은 일회용 링크 클릭 시 호출된다.
 *
 * 토큰 검증 → 베타 접근 쿠키 주입 → /beta 리다이렉트.
 * 검증 실패(없음/무효/만료)는 /beta?error=... 로 리다이렉트해 안내한다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const origin = url.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/beta?error=missing`);
  }

  const result = await verifyMagicToken(token);
  if (!result.valid) {
    return NextResponse.redirect(`${origin}/beta?error=${result.error.toLowerCase()}`);
  }

  await setBetaAccessCookie(token);
  return NextResponse.redirect(`${origin}/beta`);
}
