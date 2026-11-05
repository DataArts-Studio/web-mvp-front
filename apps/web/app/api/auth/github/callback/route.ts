import { NextRequest, NextResponse } from 'next/server';

import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_PATH,
  verifyOAuthState,
} from '@/entities/github-connection/lib/oauth-state';

/**
 * OAuth 결과를 부모 창(opener)으로 postMessage 후 팝업을 닫는 HTML 응답.
 *
 * 보안:
 * - 메시지 객체를 JSON.stringify 로 직렬화하고 `<` 를 유니코드로 이스케이프해
 *   `</script>` 탈출 및 HTML/JS 주입(reflected XSS)을 차단한다.
 * - targetOrigin 을 `'*'` 가 아니라 현재 앱 오리진으로 고정해 임의 opener 로의
 *   메시지(특히 OAuth code) 유출을 막는다.
 * - state 쿠키는 한 번 쓰면 지운다 (재사용 방지).
 */
function renderOAuthResult(message: Record<string, unknown>, targetOrigin: string): NextResponse {
  const payload = JSON.stringify(message).replace(/</g, '\\u003c');
  const origin = JSON.stringify(targetOrigin);
  const response = new NextResponse(
    `<!DOCTYPE html><html><body><script>
      window.opener?.postMessage(${payload}, ${origin});
      window.close();
    </script></body></html>`,
    // charset 이 없으면 브라우저가 한국어 오류 문구를 Windows-1252 로 읽어 깨진 채 전달한다.
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
  response.cookies.set(OAUTH_STATE_COOKIE, '', { path: OAUTH_STATE_COOKIE_PATH, maxAge: 0 });
  return response;
}

const FAILURE = { type: 'github-oauth', success: false, error: 'OAuth 인증에 실패했습니다.' };

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const targetOrigin = req.nextUrl.origin;

  // 에러 처리 (외부 입력 error 문자열은 반사하지 않고 고정 메시지 사용)
  if (error || !code) {
    return renderOAuthResult(FAILURE, targetOrigin);
  }

  // 이 브라우저가 시작한 연결인지 확인한다. projectId 는 쿼리가 아니라 쿠키에서 가져온다.
  const projectId = verifyOAuthState(state, req.cookies.get(OAUTH_STATE_COOKIE)?.value);
  if (!projectId) {
    return renderOAuthResult(FAILURE, targetOrigin);
  }

  // 성공 시 code를 부모 창에 전달
  return renderOAuthResult({ type: 'github-oauth', success: true, code, projectId }, targetOrigin);
}
