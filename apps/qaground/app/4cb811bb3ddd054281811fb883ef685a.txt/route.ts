// IndexNow 키 검증 파일. IndexNow 는 이 URL(<key>.txt)이 키 문자열을 그대로
// 반환해야 제출을 신뢰한다. Bing·네이버·Yandex 가 이 프로토콜을 소비한다(구글은 미사용).
// 키는 비밀이 아니라 공개 값이므로 하드코딩한다. scripts/ping-indexnow.mjs 와 동일해야 한다.
export const dynamic = 'force-static';

const INDEXNOW_KEY = '4cb811bb3ddd054281811fb883ef685a';

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
