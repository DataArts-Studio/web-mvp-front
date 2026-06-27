import type { MetadataRoute } from 'next';

const SITE_URL = 'https://qaground.gettestea.com';

export default function robots(): MetadataRoute.Robots {
  return {
    // /sandbox/* 는 테스트 대상 픽스처(저품질), /api/* 는 엔드포인트라 색인 제외.
    rules: { userAgent: '*', allow: '/', disallow: ['/sandbox/', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
