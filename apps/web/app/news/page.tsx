import type { Metadata } from 'next';

import { getPublishedPosts } from '@/shared/lib/posts';
import { PostListView } from '@/view';

export default async function NewsListPage() {
  const posts = await getPublishedPosts('news');

  return (
    <PostListView
      title="소식·공지"
      description="제품 점검·릴리스·정책 안내를 시간순으로 모았습니다."
      surfaceLabel="소식·공지"
      basePath="/news"
      posts={posts}
      categoryOptions={['notice']}
      emptyMessage="아직 등록된 소식이 없습니다."
    />
  );
}

export const metadata: Metadata = {
  title: '소식·공지',
  description: '테스티아(Testea) 점검·릴리스·정책 안내를 시간순으로 확인하세요.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: '소식·공지 | 테스티아(Testea)',
    description: '테스티아(Testea) 점검·릴리스·정책 안내를 시간순으로 확인하세요.',
    type: 'website',
  },
};
