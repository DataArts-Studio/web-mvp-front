import type { MetadataRoute } from 'next';

import { CHALLENGES } from '@/shared/challenges/registry';

// Sitemap for public crawlable qaground pages.
const SITE_URL = 'https://qaground.gettestea.com';
const CONTENT_UPDATED_AT = new Date('2026-07-01');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: CONTENT_UPDATED_AT, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/playground`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/playground/postman-v1`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/challenges`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/learn`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const challengePages: MetadataRoute.Sitemap = CHALLENGES.map((c) => ({
    url: `${SITE_URL}/challenges/${c.slug}`,
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...challengePages];
}
