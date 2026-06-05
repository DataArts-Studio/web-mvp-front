import { MetadataRoute } from 'next';

import { getPublishedPosts } from '@/shared/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://gettestea.com';

  // 각 ko 경로에 en hreflang 대안을 붙여 중복 URL 없이 다국어 색인을 노출한다.
  const localized = (path: string) => ({
    ko: `${siteUrl}${path}`,
    en: `${siteUrl}/en${path}`,
  });

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          ko: siteUrl,
          en: `${siteUrl}/en`,
        },
      },
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: localized('/docs') },
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: localized('/team') },
    },
    {
      url: `${siteUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: { languages: localized('/legal') },
    },
  ];

  const [blogPosts, newsPosts] = await Promise.all([
    getPublishedPosts('blog'),
    getPublishedPosts('news'),
  ]);

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const newsEntries: MetadataRoute.Sitemap = newsPosts.map((post) => ({
    url: `${siteUrl}/news/${post.slug}`,
    lastModified: new Date(post.frontmatter.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticEntries, ...blogEntries, ...newsEntries];
}
