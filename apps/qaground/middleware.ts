import { NextResponse } from 'next/server';

/**
 * 미사용 베타 라우트(waitlist·magic) 직접 접근 차단.
 *
 * 베타 신청 폼·매직링크는 현재 보류(계정/알림 도입 시 재개)라 앱에서 호출되지 않는다.
 * 라우트 코드는 남겨 두되, 외부에서 직접 요청하면 404 로 막아 노출·오작동을 방지한다.
 * 챌린지가 쓰는 /api/practice, /api/challenges 는 막지 않는다(matcher 에서 제외).
 */
export function middleware() {
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ['/api/waitlist', '/api/magic/:path*'],
};
