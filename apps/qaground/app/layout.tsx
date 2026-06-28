import type { Metadata } from 'next';

import '@/app-shell/globals.css';
import { ProductionScripts } from '@/shared/analytics/production-scripts';

const SITE_URL = 'https://qaground.gettestea.com';
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

const DESCRIPTION =
  'qaground(큐에이그라운드)는 테스티아(Testea)가 만든 QA 연습 플레이그라운드입니다. 로그인 없이 로그인 폼·API·결제 같은 실제형 연습 대상에 Playwright·Postman 테스트를 직접 작성해 실행하고 채점받으세요. QA 과제전형·과제 연습·과제 테스트 준비에도 활용할 수 있습니다.';

const TITLE = 'qaground — QA 자동화 연습 플레이그라운드 | 테스티아';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | qaground',
  },
  description: DESCRIPTION,
  keywords: [
    // 브랜드
    '테스티아',
    'Testea',
    'qaground',
    '큐에이그라운드',
    '큐에이',
    // 과제전형·채용
    'QA 과제',
    '과제 테스트',
    'QA 과제전형',
    'QA 채용 과제',
    'QA 채용',
    '개발자 과제전형',
    '코딩 과제전형',
    '과제전형',
    '과제전형 연습',
    '과제 연습',
    'QA 과제 연습',
    '코딩 과제전형 연습',
    '실무 과제 연습',
    'QA 면접 준비',
    'QA 신입',
    // 연습·학습
    'QA 자동화 연습',
    '테스트 자동화 연습',
    'QA 연습',
    '테스트 케이스 연습',
    'QA 실습',
    'QA 입문',
    'QA 공부',
    'QA 독학',
    'QA 포트폴리오',
    '웹 테스트 연습',
    'QA 코딩테스트',
    'QA 코테',
    '테스트 코드 연습',
    '웹 자동화 연습',
    '테스트 자동화 실습',
    // 도구
    'Playwright',
    'Playwright 연습',
    'Playwright 튜토리얼',
    'Playwright 예제',
    'Postman',
    'Postman 연습',
    'API 테스트',
    'API 테스트 연습',
    'Selenium 대안',
    'Cypress 대안',
    'E2E 테스트',
    'E2E 테스트 연습',
    // 역할·일반
    'QA 엔지니어',
    '테스터',
    '테스트',
    'QA',
    '소프트웨어 테스트',
    '테스트 자동화',
    '자동화 테스트',
    '품질 보증',
    'SQA',
  ],
  applicationName: 'qaground',
  authors: [{ name: 'Testea', url: 'https://gettestea.com' }],
  creator: 'Testea',
  publisher: 'Testea',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: 'qaground',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    other: {
      'naver-site-verification': '2a41c60503088ea4c2589bb5f5fdf7861b3306e9',
      // AdSense 사이트 소유확인 (퍼블리셔 ID는 공개 정보라 하드코딩).
      'google-adsense-account': 'ca-pub-4243558524225646',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'qaground',
      alternateName: '큐에이그라운드',
      description: DESCRIPTION,
      inLanguage: 'ko-KR',
      // gettestea.com 과 동일한 Organization 엔티티(@id)로 묶어 같은 브랜드(테스티아)로 인식시킨다.
      publisher: { '@id': 'https://gettestea.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://gettestea.com/#organization',
      name: 'Testea',
      alternateName: '테스티아',
      url: 'https://gettestea.com',
      sameAs: ['https://gettestea.com'],
      description: '테스티아(Testea)가 운영하는 QA 자동화 연습 플레이그라운드 qaground',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // GA/AdSense는 production 배포 + 운영 호스트에서만 로드. dev 서브도메인은 production 배포여도 차단.
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gaEnabled = !!gaId && process.env.VERCEL_ENV === 'production';
  const adsEnabled = !!ADSENSE_ID && process.env.VERCEL_ENV === 'production';

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="bg-bg-1 text-text-1 flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
      {(gaEnabled || adsEnabled) && (
        <ProductionScripts
          gaId={gaEnabled ? gaId : undefined}
          adsenseId={adsEnabled ? ADSENSE_ID : undefined}
        />
      )}
    </html>
  );
}
