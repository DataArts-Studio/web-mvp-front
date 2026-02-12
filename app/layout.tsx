import React, { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';

import { QueryProvider } from '@/app-shell/providers/query-provider';
import '@/app-shell/styles/globals.css';
import { GoogleTagManager } from '@next/third-parties/google';
import { MvpBottomNavbar } from 'src/shared';

// production 또는 로컬 개발 환경에서는 indexing 허용, preview(dev 브랜치)에서만 차단
const allowIndexing = process.env.VERCEL_ENV !== 'preview';
const siteUrl = 'https://gettestea.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Testea - 테스트 관리 플랫폼',
    template: '%s | Testea',
  },
  description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼. 테스트 계획, 실행, 결과 추적을 한 곳에서.',
  keywords: [
    '테스트 관리',
    'QA',
    '테스트 케이스',
    '품질 관리',
    'test management',
    'QA 도구',
    '테스트 자동화',
    '소프트웨어 테스트',
    '테스트 플랫폼',
    'Testea',
    '테스티아',
  ],
  authors: [{ name: 'Testea', url: siteUrl }],
  creator: 'Testea',
  publisher: 'Testea',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
    },
  },
  openGraph: {
    title: 'Testea - 테스트 관리 플랫폼',
    description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼. 테스트 계획, 실행, 결과 추적을 한 곳에서.',
    url: siteUrl,
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Testea',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Testea - 테스트 관리 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Testea - 테스트 관리 플랫폼',
    description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼. 테스트 계획, 실행, 결과 추적을 한 곳에서.',
    creator: '@testea',
    images: ['/opengraph-image'],
  },
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
    googleBot: {
      index: allowIndexing,
      follow: allowIndexing,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  verification: {
    // Google Search Console 인증 시 추가
    // google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: '#0BB57F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Testea',
      description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼',
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Testea',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description:
        '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼. 테스트 계획, 실행, 결과 추적을 한 곳에서.',
      url: siteUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        '테스트 케이스 관리',
        '테스트 스위트 관리',
        '테스트 실행 추적',
        '마일스톤 관리',
        '팀 협업',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Testea',
      url: siteUrl,
      logo: `${siteUrl}/icon`,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'gettestea@gmail.com',
        contactType: 'customer service',
        availableLanguage: 'Korean',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
        {/* 테스트용 컴포넌트 */}
        <MvpBottomNavbar />
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
      </body>
    </html>
  );
}
