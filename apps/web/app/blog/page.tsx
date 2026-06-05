import type { Metadata } from 'next';

import { POST_CATEGORIES, type PostCategory, getPublishedPosts } from '@/shared/lib/posts';
import { PostListView } from '@/view';

interface BlogListPageProps {
  searchParams: Promise<{ category?: string }>;
}

const BLOG_CATEGORIES: PostCategory[] = ['product', 'guide', 'release'];

function parseCategory(raw?: string): PostCategory | undefined {
  if (!raw) return undefined;
  return POST_CATEGORIES.find((c) => c === raw);
}

export default async function BlogListPage({ searchParams }: BlogListPageProps) {
  const { category } = await searchParams;
  const selected = parseCategory(category);
  const posts = await getPublishedPosts('blog');

  return (
    <PostListView
      title="블로그"
      description="제품 소식·사용 가이드·릴리스 노트를 모았습니다."
      surfaceLabel="블로그"
      basePath="/blog"
      posts={posts}
      categoryOptions={BLOG_CATEGORIES}
      selectedCategory={selected}
    />
  );
}

export const metadata: Metadata = {
  title: '블로그',
  description:
    '테스티아(Testea) 블로그 - 테스트 케이스, QA 도구, 소프트웨어 테스트 가이드 및 릴리스 소식을 전합니다.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: '블로그 | 테스티아(Testea)',
    description:
      '테스티아(Testea) 블로그 - 테스트 케이스, QA 도구, 소프트웨어 테스트 가이드 및 릴리스 소식을 전합니다.',
    type: 'website',
  },
};
