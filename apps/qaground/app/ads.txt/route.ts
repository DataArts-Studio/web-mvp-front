// AdSense ads.txt (qaground 서브도메인 — 실제 광고 게재처).
// 퍼블리셔 ID는 공개 정보라 하드코딩. 계정 도메인은 gettestea.com.
export const dynamic = 'force-static';

export function GET() {
  const body = 'google.com, pub-4243558524225646, DIRECT, f08c47fec0942fa0\n';
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
