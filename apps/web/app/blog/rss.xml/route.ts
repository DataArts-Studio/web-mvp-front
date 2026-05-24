import { getPublishedPosts } from '@/shared/lib/posts';
import { renderRssFeed } from '@/shared/lib/rss';

export async function GET() {
  const posts = await getPublishedPosts('blog');
  const xml = renderRssFeed({
    title: '테스티아(Testea) 블로그',
    description:
      '테스티아(Testea) 블로그 - 테스트 케이스, QA 도구, 소프트웨어 테스트 가이드 및 릴리스 소식.',
    path: '/blog',
    posts,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
