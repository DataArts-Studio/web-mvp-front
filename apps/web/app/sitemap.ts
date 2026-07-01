import { MetadataRoute } from 'next';

import { NESTED_DOC_SLUGS } from '@/view/docs/docs-loader';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://gettestea.com';
  const contentUpdatedAt = new Date('2026-07-01');

  // Expose ko/en hreflang pairs without duplicate sitemap entries.
  const localized = (path: string) => ({
    ko: `${siteUrl}${path}`,
    en: `${siteUrl}/en${path}`,
  });

  return [
    {
      url: siteUrl,
      lastModified: contentUpdatedAt,
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
      lastModified: contentUpdatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: localized('/docs') },
    },
    ...NESTED_DOC_SLUGS.map((slug) => ({
      url: `${siteUrl}/docs/${slug}`,
      lastModified: contentUpdatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: { languages: localized(`/docs/${slug}`) },
    })),
    {
      url: `${siteUrl}/team`,
      lastModified: contentUpdatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: localized('/team') },
    },
  ];
}
