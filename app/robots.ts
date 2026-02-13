import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // production 또는 로컬 개발 환경에서는 indexing 허용, preview(dev 브랜치)에서만 차단
  const allowIndexing = process.env.VERCEL_ENV !== 'preview';

  if (!allowIndexing) {
    // dev 환경: 모든 크롤러 차단
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // production 환경: 크롤링 허용 (프라이빗 페이지는 미들웨어 인증으로 보호)
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/projects/*/access', '/api/'],
    },
    sitemap: 'https://gettestea.com/sitemap.xml',
  };
}
