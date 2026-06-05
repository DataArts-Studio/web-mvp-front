import Image from 'next/image';
import Link from 'next/link';

import { CATEGORY_LABEL, type Post } from '@/shared/lib/posts';

interface PostCardProps {
  post: Post;
  /** 카드를 클릭했을 때 이동할 경로의 prefix (`/blog` 또는 `/news`) */
  basePath: '/blog' | '/news';
}

export function PostCard({ post, basePath }: PostCardProps) {
  const { slug, frontmatter } = post;
  const href = `${basePath}/${slug}`;

  return (
    <Link
      href={href}
      className="group border-line-2 bg-bg-2 hover:border-primary/60 flex flex-col overflow-hidden rounded-lg border transition-colors"
    >
      {frontmatter.coverImage && (
        <div className="bg-bg-3 relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={frontmatter.coverImage}
            alt={frontmatter.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="bg-primary/15 text-primary typo-caption-heading rounded-full px-2.5 py-0.5">
            {CATEGORY_LABEL[frontmatter.category]}
          </span>
          <time dateTime={frontmatter.publishedAt} className="typo-caption-normal text-text-4">
            {frontmatter.publishedAt}
          </time>
        </div>
        <h3 className="typo-h3-heading text-text-1 group-hover:text-primary line-clamp-2 transition-colors">
          {frontmatter.title}
        </h3>
        {frontmatter.excerpt && (
          <p className="typo-body2-normal text-text-3 line-clamp-2 leading-relaxed">
            {frontmatter.excerpt}
          </p>
        )}
        {frontmatter.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {frontmatter.tags.map((tag) => (
              <li
                key={tag}
                className="border-line-2 text-text-4 typo-caption-normal rounded-full border px-2 py-0.5"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
