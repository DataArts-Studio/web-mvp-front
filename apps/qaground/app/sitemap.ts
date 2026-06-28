import type { MetadataRoute } from 'next';

import { CHALLENGES } from '@/shared/challenges/registry';

// 챌린지 추가 시 자동 반영되는 사이트맵.
const SITE_URL = 'https://qaground.gettestea.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/preview`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/challenges`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const challengePages: MetadataRoute.Sitemap = CHALLENGES.map((c) => ({
    url: `${SITE_URL}/challenges/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...challengePages];
}
