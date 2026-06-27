// AdSense ads.txt (gettestea.com — 애드센스 등록(최상위) 도메인).
// 광고 ad unit 자체는 qaground 서브도메인에만 게재한다(테스티아 화면은 광고 없음).
// 퍼블리셔 라인 + 서브도메인 위임으로 크롤러가 qaground ads.txt 도 인식하게 한다.
export const dynamic = 'force-static';

export function GET() {
  const body = [
    'google.com, pub-4243558524225646, DIRECT, f08c47fec0942fa0',
    'subdomain=qaground.gettestea.com',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
