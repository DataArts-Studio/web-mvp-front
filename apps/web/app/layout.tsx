import React, { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Script from 'next/script';

import { LazyToaster } from '@/app-shell/providers/lazy-toaster';
import { QueryProvider } from '@/app-shell/providers/query-provider';
import '@/app-shell/styles/globals.css';
import { CriticalBanner } from '@/widgets/announcement-banner';
import { AnnouncementPopup } from '@/widgets/announcement-popup';
import { MvpBottomNavbarLazy } from '@testea/ui';

// production 또는 로컬 개발 환경에서는 indexing 허용, preview(dev 브랜치)에서만 차단
const allowIndexing = process.env.VERCEL_ENV !== 'preview';
const siteUrl = 'https://gettestea.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '테스티아(Testea) - AI 기반 무료 QA 도구 · 테스트 관리 플랫폼',
    template: '%s | 테스티아(Testea)',
  },
  description:
    '요구사항 기반 AI 테스트 시나리오·케이스 생성, 실행, 결과 추적을 한 곳에서. 무료 QA 도구 테스티아.',
  keywords: [
    '테스트 관리',
    '테스트 관리 도구',
    '테스트 도구',
    '테스트 툴',
    'QA 도구',
    'QA도구',
    'QA 툴',
    'QA툴',
    'QA',
    'QA 관리',
    '테스트 케이스',
    '테스트 케이스 관리',
    '테스트 케이스 도구',
    '품질 관리',
    '품질 보증',
    'test management',
    'QA tool',
    'test tool',
    'test case management',
    '테스트 자동화',
    '소프트웨어 테스트',
    '소프트웨어 QA',
    '테스트 플랫폼',
    '무료 QA 도구',
    '무료 테스트 도구',
    '테스트 시나리오',
    '테스트 시나리오 관리',
    '테스트 시나리오 작성',
    '요구사항 기반 테스트',
    'AI 테스트 케이스 생성',
    'AI 테스트 시나리오 생성',
    '테스트 케이스 작성',
    'QA 협업 도구',
    '테스트 케이스 템플릿',
    '테스트 관리 시스템',
    '테스트 케이스 작성법',
    '요구사항 관리',
    '버그 추적',
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
      'en-US': '/en',
    },
  },
  openGraph: {
    title: '테스티아(Testea) - AI 기반 무료 QA 도구 · 테스트 관리 플랫폼',
    description:
      '요구사항 기반 AI 테스트 시나리오·케이스 생성, 실행, 결과 추적을 한 곳에서. 무료 QA 도구 테스티아.',
    url: siteUrl,
    type: 'website',
    locale: 'ko_KR',
    siteName: '테스티아(Testea)',
    // images 는 명시하지 않는다. Next 의 파일 컨벤션(opengraph-image)이 라우트 세그먼트별로
    // 자동 매핑돼, [locale] 마케팅은 로케일별 OG, 루트(제품/공유)는 기본 OG 를 쓴다.
  },
  twitter: {
    card: 'summary_large_image',
    title: '테스티아(Testea) - AI 기반 무료 QA 도구 · 테스트 관리 플랫폼',
    description:
      '요구사항 기반 AI 테스트 시나리오·케이스 생성, 실행, 결과 추적을 한 곳에서. 무료 QA 도구 테스티아.',
    creator: '@testea',
    // images 미지정: twitter-image 파일 컨벤션이 라우트별로 자동 매핑된다.
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
      alternateName: '테스티아',
      description: '무료 QA 도구 · QA 툴 · 테스트 관리 플랫폼',
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Testea',
      alternateName: '테스티아',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      inLanguage: 'ko-KR',
      keywords: 'AI QA 도구, 테스트 시나리오 관리, 요구사항 기반 테스트, 무료 테스트 관리',
      description:
        '요구사항 기반 AI 테스트 시나리오·케이스 생성부터 실행, 결과 추적까지. 무료 QA 도구 · 소프트웨어 테스트 관리 플랫폼.',
      url: siteUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        '요구사항 기반 테스트 시나리오 관리',
        'AI 테스트 시나리오·케이스 자동 생성',
        '시나리오 기반 테스트 스위트 파생',
        '테스트 케이스 관리',
        '테스트 스위트 관리',
        '테스트 실행 추적',
        '마일스톤 관리',
        '테스트 케이스 템플릿',
        '프로젝트 구조화',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Testea',
      alternateName: '테스티아',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // [locale] 라우트에서는 ko|en, 그 밖(제품/공유/api)에서는 defaultLocale(ko) 로 폴백.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2-dynamic-subset/PretendardVariable.subset.91.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          media="print"
          data-font-css
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <CriticalBanner />
            <AnnouncementPopup />
            {children}
          </QueryProvider>
          <LazyToaster />
          {/* 테스트용 컴포넌트 */}
          <MvpBottomNavbarLazy />
        </NextIntlClientProvider>
        <Script
          id="font-swap"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `var f=document.querySelector('[data-font-css]');if(f){if(f.sheet){f.media='all'}else{f.addEventListener('load',function(){this.media='all'})}}`,
          }}
        />
        {/* GTM은 production 배포에서만 로드. preview(dev 브랜치)·로컬은 GTM_ID가 주입돼도 차단 */}
        {process.env.NEXT_PUBLIC_GTM_ID && process.env.VERCEL_ENV === 'production' && (
          <>
            <Script
              id="gtm-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`,
              }}
            />
            <Script
              id="gtm-script"
              src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              strategy="lazyOnload"
            />
          </>
        )}
      </body>
    </html>
  );
}
