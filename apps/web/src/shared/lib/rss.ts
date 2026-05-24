/**
 * RSS 2.0 피드 생성 유틸. 외부 라이브러리를 추가하지 않기 위해 단순 문자열로 빌드한다.
 */
import { CATEGORY_LABEL, type Post } from './posts';

const SITE_URL = 'https://gettestea.com';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(dateString: string): string {
  // frontmatter publishedAt 은 YYYY-MM-DD 형식. UTC 자정 기준으로 변환한다.
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toUTCString();
}

interface FeedOptions {
  title: string;
  description: string;
  path: '/blog' | '/news';
  posts: Post[];
}

export function renderRssFeed({ title, description, path, posts }: FeedOptions): string {
  const feedUrl = `${SITE_URL}${path}/rss.xml`;
  const siteSectionUrl = `${SITE_URL}${path}`;
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}${path}/${post.slug}`;
      const pubDate = toRfc822(post.frontmatter.publishedAt);
      const categoryLabel = CATEGORY_LABEL[post.frontmatter.category];
      const description = post.frontmatter.excerpt ?? '';

      return [
        '    <item>',
        `      <title>${escapeXml(post.frontmatter.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${escapeXml(categoryLabel)}</category>`,
        `      <description>${escapeXml(description)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${siteSectionUrl}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    '    <language>ko-KR</language>',
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}
