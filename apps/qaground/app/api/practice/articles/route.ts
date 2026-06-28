import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ARTICLES = [
  { id: 1, title: 'API 테스트 입문', tag: 'api', author: 'qa-team', views: 150 },
  { id: 2, title: 'Playwright locator 전략', tag: 'automation', author: 'qa-team', views: 240 },
  { id: 3, title: '결함 리포트 잘 쓰는 법', tag: 'manual', author: 'support', views: 90 },
  { id: 4, title: '웹훅 테스트 체크리스트', tag: 'api', author: 'platform', views: 180 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort');
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  let data = ARTICLES.slice();
  if (q) data = data.filter((article) => article.title.toLowerCase().includes(q));
  if (tag) data = data.filter((article) => article.tag === tag);
  if (sort === 'views' || sort === 'title') {
    data.sort((a, b) => {
      const cmp = sort === 'views' ? a.views - b.views : a.title.localeCompare(b.title, 'ko');
      return order === 'desc' ? -cmp : cmp;
    });
  }

  return NextResponse.json({ total: data.length, data });
}
