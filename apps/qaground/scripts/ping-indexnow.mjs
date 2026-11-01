// IndexNow 제출 스크립트.
//
// 라이브 sitemap.xml 의 URL 을 IndexNow 엔드포인트에 밀어 Bing·네이버·Yandex 가
// 즉시 (재)크롤하도록 유도한다. 구글은 IndexNow 를 소비하지 않으므로, 구글 색인은
// 여전히 Search Console 사이트맵 제출 + 시간에 의존한다.
//
// 사용:  pnpm --filter qaground seo:ping
// 배포 훅에 걸어 자동 제출하려면 Vercel Deploy Hook 에서 이 스크립트를 호출한다.

const HOST = 'qaground.gettestea.com';
const KEY = '4cb811bb3ddd054281811fb883ef685a'; // app/<key>.txt/route.ts 와 동일해야 함
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function loadSitemapUrls() {
  const res = await fetch(SITEMAP_URL, { headers: { 'user-agent': 'qaground-indexnow' } });
  if (!res.ok) throw new Error(`sitemap fetch 실패: ${res.status} ${res.statusText}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error('sitemap 에서 URL 을 찾지 못함');
  return urls;
}

async function submit(urlList) {
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  // IndexNow 는 200(수락)·202(수신, 검증 대기)를 성공으로 본다.
  return res.status;
}

async function main() {
  const urls = await loadSitemapUrls();
  console.log(`IndexNow 제출: ${urls.length}개 URL → ${INDEXNOW_ENDPOINT}`);
  const status = await submit(urls);
  if (status === 200 || status === 202) {
    console.log(`완료 (HTTP ${status}). Bing·네이버·Yandex 재크롤 큐에 등록됨.`);
  } else {
    console.error(`실패 (HTTP ${status}). 키 파일 접근·형식을 확인하세요: ${KEY_LOCATION}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
