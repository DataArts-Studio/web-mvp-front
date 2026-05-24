/**
 * 공개 마케팅 사이트 콘텐츠(블로그·소식)의 빌드 타임 로더.
 *
 * - 콘텐츠는 `apps/web/content/{blog,news}/*.md` 에 저장된 frontmatter + 마크다운 파일
 * - frontmatter 는 Zod 로 검증 (실패 시 빌드 차단)
 * - `draft: true` 또는 `publishedAt` 이 미래인 글은 공개 목록에서 제외
 *
 * 참고: Notion FDD-BL01 는 `.mdx` 를 권장하지만, 본 리포는 docs/legal 가
 * 모두 `.md` + react-markdown 으로 동작 중이라 동일 패턴을 따른다. 본문에
 * 커스텀 React 컴포넌트를 끼워야 할 시점이 오면 MDX 파이프라인 도입을
 * 별도 작업으로 다룬다.
 */
import { readFile, readdir } from 'fs/promises';
import matter from 'gray-matter';
import { extname, join } from 'path';
import { z } from 'zod';

export const POST_CATEGORIES = ['product', 'guide', 'release', 'notice'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_COLLECTIONS = ['blog', 'news'] as const;
export type PostCollection = (typeof POST_COLLECTIONS)[number];

/**
 * 블로그·소식 글의 frontmatter 스키마.
 *
 * Notion FDD-BL01 의 정의를 그대로 따른다.
 */
export const PostFrontmatterSchema = z.object({
  title: z.string().min(1).max(120),
  excerpt: z.string().max(200).optional(),
  category: z.enum(POST_CATEGORIES),
  tags: z.array(z.string()).default([]),
  publishedAt: z.iso.date(),
  coverImage: z.string().optional(),
  author: z.string().min(1),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

export interface Post {
  collection: PostCollection;
  slug: string;
  frontmatter: PostFrontmatter;
  /** 원문 마크다운 (frontmatter 제외) */
  content: string;
}

const CONTENT_ROOT = join(process.cwd(), 'content');

function contentDir(collection: PostCollection): string {
  return join(CONTENT_ROOT, collection);
}

/**
 * 콘텐츠 파일로 인정할 슬러그 패턴.
 *
 * FDD-BL01 가 정한 "소문자·하이픈 slug" 규약을 그대로 강제한다. 결과적으로
 * `README.md` 같은 작성 안내 문서는 자동으로 제외된다.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => {
        if (!entry.isFile() || extname(entry.name) !== '.md') return false;
        const slug = entry.name.replace(/\.md$/, '');
        return SLUG_PATTERN.test(slug);
      })
      .map((entry) => entry.name);
  } catch (error) {
    // 디렉터리가 아직 없는 경우(샘플 글 0개) 빈 목록을 반환
    if (isNoEntError(error)) return [];
    throw error;
  }
}

function isNoEntError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

async function loadPost(collection: PostCollection, filename: string): Promise<Post> {
  const slug = filename.replace(/\.md$/, '');
  const filePath = join(contentDir(collection), filename);
  const raw = await readFile(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const parsed = PostFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`[posts] frontmatter 검증 실패: content/${collection}/${filename}\n${issues}`);
  }

  return {
    collection,
    slug,
    frontmatter: parsed.data,
    content,
  };
}

/**
 * 공개 가능한지 여부.
 *
 * - `draft: true` 인 글은 제외
 * - `publishedAt` 이 미래(now 보다 큼)인 글은 제외
 */
export function isPublishable(post: Post, now: Date = new Date()): boolean {
  if (post.frontmatter.draft) return false;
  const publishedAt = new Date(post.frontmatter.publishedAt);
  return publishedAt.getTime() <= now.getTime();
}

/**
 * 컬렉션의 전체 글을 frontmatter 검증 후 반환한다. 공개 가능 여부와 무관하게 모두 포함.
 */
export async function getAllPosts(collection: PostCollection): Promise<Post[]> {
  const files = await listMarkdownFiles(contentDir(collection));
  const posts = await Promise.all(files.map((file) => loadPost(collection, file)));
  posts.sort(
    (a, b) =>
      new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime()
  );
  return posts;
}

/**
 * 공개 가능한 글만 최신순으로 반환한다. 목록·sitemap·RSS 등 공개 surface 에서 사용한다.
 */
export async function getPublishedPosts(collection: PostCollection): Promise<Post[]> {
  const posts = await getAllPosts(collection);
  return posts.filter((post) => isPublishable(post));
}

/**
 * 단일 글을 slug 로 조회. 비공개·예약·존재하지 않는 글은 `null`.
 */
export async function getPostBySlug(
  collection: PostCollection,
  slug: string
): Promise<Post | null> {
  const posts = await getAllPosts(collection);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return null;
  if (!isPublishable(post)) return null;
  return post;
}

/**
 * 같은 컬렉션에서 현재 글 외 최신 N 개를 관련 글 후보로 반환.
 */
export async function getRelatedPosts(
  collection: PostCollection,
  excludeSlug: string,
  limit = 3
): Promise<Post[]> {
  const posts = await getPublishedPosts(collection);
  return posts.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  product: '프로덕트',
  guide: '가이드',
  release: '릴리스',
  notice: '공지',
};
