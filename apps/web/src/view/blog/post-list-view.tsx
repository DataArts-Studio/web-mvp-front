import { CATEGORY_LABEL, type Post, type PostCategory } from '@/shared/lib/posts';

import { BlogShell } from './blog-shell';
import { PostCard } from './post-card';

interface PostListViewProps {
  /** 페이지 H1 */
  title: string;
  /** 페이지 부제 (선택) */
  description?: string;
  /** breadcrumb 라벨 */
  surfaceLabel: string;
  /** 카드 링크 prefix */
  basePath: '/blog' | '/news';
  posts: Post[];
  /** 카테고리 필터에 노출할 옵션. 미지정 시 글에 등장한 카테고리에서 자동 추출 */
  categoryOptions?: PostCategory[];
  /** 현재 선택된 카테고리 (URL 쿼리 ?category=...) */
  selectedCategory?: PostCategory;
  /** 빈 상태 문구 */
  emptyMessage?: string;
}

export function PostListView({
  title,
  description,
  surfaceLabel,
  basePath,
  posts,
  categoryOptions,
  selectedCategory,
  emptyMessage = '아직 등록된 글이 없습니다.',
}: PostListViewProps) {
  const filtered = selectedCategory
    ? posts.filter((post) => post.frontmatter.category === selectedCategory)
    : posts;

  const visibleCategories =
    categoryOptions ?? Array.from(new Set(posts.map((post) => post.frontmatter.category))).sort();

  return (
    <BlogShell surfaceLabel={surfaceLabel}>
      <header className="mb-8">
        <h1 className="typo-h1-heading text-text-1">{title}</h1>
        {description && (
          <p className="typo-body1-normal text-text-3 mt-3 leading-relaxed">{description}</p>
        )}
      </header>

      {visibleCategories.length > 1 && (
        <nav aria-label="카테고리" className="mb-8 flex flex-wrap gap-2">
          <CategoryLink basePath={basePath} active={!selectedCategory} label="전체" />
          {visibleCategories.map((category) => (
            <CategoryLink
              key={category}
              basePath={basePath}
              category={category}
              active={selectedCategory === category}
              label={CATEGORY_LABEL[category]}
            />
          ))}
        </nav>
      )}

      {filtered.length === 0 ? (
        <p className="border-line-2 text-text-3 typo-body2-normal rounded-lg border border-dashed px-6 py-16 text-center">
          {emptyMessage}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filtered.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} basePath={basePath} />
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  );
}

interface CategoryLinkProps {
  basePath: '/blog' | '/news';
  category?: PostCategory;
  active: boolean;
  label: string;
}

function CategoryLink({ basePath, category, active, label }: CategoryLinkProps) {
  const href = category ? `${basePath}?category=${category}` : basePath;
  return (
    <a
      href={href}
      className={
        active
          ? 'bg-primary text-text-1 typo-caption-heading rounded-full px-3 py-1.5'
          : 'border-line-2 text-text-3 hover:bg-bg-3 hover:text-text-1 typo-caption-normal rounded-full border px-3 py-1.5 transition-colors'
      }
    >
      {label}
    </a>
  );
}
