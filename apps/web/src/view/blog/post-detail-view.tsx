import Image from 'next/image';
import Link from 'next/link';

import { CATEGORY_LABEL, type Post } from '@/shared/lib/posts';

import { BlogShell } from './blog-shell';
import { PostCard } from './post-card';
import { PostMarkdownContent, slugify } from './post-markdown-content';

export type PostHeading = { id: string; text: string; level: 2 | 3 };

/** h2 / h3 만 추출해 본문 우측 TOC 에 사용. */
export function extractHeadings(markdown: string): PostHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: PostHeading[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ id: slugify(text), text, level });
  }
  return headings;
}

interface PostDetailViewProps {
  surfaceLabel: string;
  basePath: '/blog' | '/news';
  post: Post;
  relatedPosts: Post[];
  headings: PostHeading[];
}

export function PostDetailView({
  surfaceLabel,
  basePath,
  post,
  relatedPosts,
  headings,
}: PostDetailViewProps) {
  const { frontmatter, content } = post;

  return (
    <BlogShell surfaceLabel={surfaceLabel}>
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
        <article className="min-w-0">
          <Link
            href={basePath}
            className="text-text-3 hover:text-text-1 typo-caption-normal mb-6 inline-flex items-center transition-colors"
          >
            ← {surfaceLabel} 목록으로
          </Link>

          <header className="border-line-2 mb-10 border-b pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="bg-primary/15 text-primary typo-caption-heading rounded-full px-2.5 py-0.5">
                {CATEGORY_LABEL[frontmatter.category]}
              </span>
              <time dateTime={frontmatter.publishedAt} className="typo-caption-normal text-text-4">
                {frontmatter.publishedAt}
              </time>
              <span className="typo-caption-normal text-text-4">·</span>
              <span className="typo-caption-normal text-text-3">{frontmatter.author}</span>
            </div>
            <h1 className="typo-h1-heading text-text-1 leading-tight">{frontmatter.title}</h1>
            {frontmatter.excerpt && (
              <p className="typo-body1-normal text-text-3 mt-4 leading-relaxed">
                {frontmatter.excerpt}
              </p>
            )}
          </header>

          {frontmatter.coverImage && (
            <div className="bg-bg-3 border-line-2 mb-10 overflow-hidden rounded-lg border">
              <Image
                src={frontmatter.coverImage}
                alt={frontmatter.title}
                width={1200}
                height={630}
                className="h-auto w-full"
                priority
              />
            </div>
          )}

          <div className="post-content">
            <PostMarkdownContent content={content} />
          </div>

          {frontmatter.tags.length > 0 && (
            <footer className="border-line-2 mt-12 border-t pt-6">
              <ul className="flex flex-wrap gap-1.5">
                {frontmatter.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border-line-2 text-text-3 typo-caption-normal rounded-full border px-2.5 py-0.5"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </footer>
          )}

          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="typo-h2-heading text-text-1 mb-5">관련 글</h2>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {relatedPosts.map((related) => (
                  <li key={related.slug}>
                    <PostCard post={related} basePath={basePath} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {headings.length > 0 && (
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6">
              <p className="typo-caption-heading text-text-3 mb-3 tracking-[0.18em] uppercase">
                목차
              </p>
              <nav className="flex flex-col gap-0.5">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={
                      heading.level === 2
                        ? 'rounded-3 typo-caption-normal text-text-2 hover:bg-bg-3 hover:text-text-1 block px-3 py-1.5 transition-colors'
                        : 'rounded-3 typo-caption-normal text-text-3 hover:bg-bg-3 hover:text-text-2 block px-3 py-1.5 pl-6 transition-colors'
                    }
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </BlogShell>
  );
}
