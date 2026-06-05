import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getAllPosts, getPostBySlug, getRelatedPosts, isPublishable } from '@/shared/lib/posts';
import { PostDetailView, extractHeadings } from '@/view';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = 'https://gettestea.com';

export async function generateStaticParams() {
  const posts = await getAllPosts('blog');
  return posts.filter((post) => isPublishable(post)).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug('blog', slug);
  if (!post) {
    return { title: '글을 찾을 수 없습니다' };
  }

  const url = `${SITE_URL}/blog/${slug}`;
  const ogImage = post.frontmatter.coverImage ?? '/opengraph-image';

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      type: 'article',
      url,
      publishedTime: post.frontmatter.publishedAt,
      authors: [post.frontmatter.author],
      tags: post.frontmatter.tags,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('blog', slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts('blog', slug);
  const headings = extractHeadings(post.content);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    datePublished: post.frontmatter.publishedAt,
    dateModified: post.frontmatter.publishedAt,
    author: { '@type': 'Organization', name: 'Testea' },
    publisher: {
      '@type': 'Organization',
      name: 'Testea',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
    image: post.frontmatter.coverImage
      ? `${SITE_URL}${post.frontmatter.coverImage}`
      : `${SITE_URL}/opengraph-image`,
    keywords: post.frontmatter.tags.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <PostDetailView
        surfaceLabel="블로그"
        basePath="/blog"
        post={post}
        relatedPosts={relatedPosts}
        headings={headings}
      />
    </>
  );
}
