import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'qaground - QA practice playground',
    short_name: 'qaground',
    description: 'Practice Playwright, Postman, and API testing without signing in.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0bb57f',
    lang: 'ko',
    categories: ['developer tools', 'education', 'productivity'],
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
