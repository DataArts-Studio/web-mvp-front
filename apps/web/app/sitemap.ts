import { MetadataRoute } from 'next';

import { NESTED_DOC_SLUGS } from '@/view/docs/docs-loader';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://gettestea.com';

  // 각 ko 경로에 en hreflang 대안을 붙여 중복 URL 없이 다국어 색인을 노출한다.
  const localized = (path: string) => ({
    ko: `${siteUrl}${path}`,
    en: `${siteUrl}/en${path}`,
  });

  return [
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
    ...NESTED_DOC_SLUGS.map((slug) => ({
      url: `${siteUrl}/docs/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: { languages: localized(`/docs/${slug}`) },
    })),
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
}
