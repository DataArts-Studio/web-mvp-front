import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/**
 * GET /api/practice/status/:code
 * - 상태 코드 시뮬레이터(httpbin 스타일). 요청한 코드로 응답한다.
 * - 200~599 범위만 허용, 그 외/숫자 아님: 400.
 * - 204 는 본문 없이, 나머지는 { status, message } 본문을 함께 준다.
 *   에러 경로(4xx/5xx) 자동화 검증 연습용.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{3}$/.test(code)) {
    return NextResponse.json({ error: 'code는 3자리 숫자여야 합니다.' }, { status: 400 });
  }
  const n = Number(code);
  if (n < 200 || n > 599) {
    return NextResponse.json({ error: 'code는 200~599 범위여야 합니다.' }, { status: 400 });
  }
  if (n === 204) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json({ status: n, message: MESSAGES[n] ?? 'Status' }, { status: n });
}
