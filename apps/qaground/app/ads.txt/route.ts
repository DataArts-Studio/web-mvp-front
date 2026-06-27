// AdSense 승인용 ads.txt. NEXT_PUBLIC_ADSENSE_ID(ca-pub-...) 가 주입되면 자동으로 채워진다.
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

export const dynamic = 'force-static';

export function GET() {
  // adsbygoogle client 는 ca-pub-..., ads.txt 의 퍼블리셔 ID 는 pub-... 형식.
  const pub = ADSENSE_ID?.replace(/^ca-/, '');
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# NEXT_PUBLIC_ADSENSE_ID 를 설정하면 ads.txt 가 채워집니다.\n';
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
