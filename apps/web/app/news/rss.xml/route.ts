import { getPublishedPosts } from '@/shared/lib/posts';
import { renderRssFeed } from '@/shared/lib/rss';

export async function GET() {
  const posts = await getPublishedPosts('news');
  const xml = renderRssFeed({
    title: '테스티아(Testea) 소식·공지',
    description: '테스티아(Testea) 점검·릴리스·정책 안내.',
    path: '/news',
    posts,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
