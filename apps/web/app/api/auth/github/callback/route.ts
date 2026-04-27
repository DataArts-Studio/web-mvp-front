import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state'); // projectId
  const error = req.nextUrl.searchParams.get('error');

  // 에러 처리
  if (error || !code || !state) {
    const errorMsg = error || 'OAuth 인증에 실패했습니다.';
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'github-oauth', success: false, error: '${errorMsg}' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  // 성공 시 code를 부모 창에 전달
  return new NextResponse(
    `<html><body><script>
      window.opener?.postMessage({ type: 'github-oauth', success: true, code: '${code}', projectId: '${state}' }, '*');
      window.close();
    </script></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  );
}
