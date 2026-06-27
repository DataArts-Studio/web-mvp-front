import type { MetadataRoute } from 'next';

// 검색 크롤러 정책: 공개 콘텐츠는 허용, 테스트 픽스처·API 는 색인 제외.
const SITE_URL = 'https://qaground.gettestea.com';

export default function robots(): MetadataRoute.Robots {
  return {
    // /sandbox/* 는 테스트 대상 픽스처(저품질), /api/* 는 엔드포인트라 색인 제외.
    rules: { userAgent: '*', allow: '/', disallow: ['/sandbox/', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
