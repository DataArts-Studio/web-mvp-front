import type { Metadata } from 'next';

import '@/app-shell/globals.css';

const SITE_URL = 'https://qaground.gettestea.com';

const DESCRIPTION =
  'qaground(큐에이그라운드)는 테스티아(Testea)가 만든 QA 연습 플레이그라운드입니다. 로그인 없이 로그인 폼·API·결제 같은 실제형 연습 대상에 Playwright·Postman 테스트를 직접 작성해 실행하고 채점받으세요. QA 과제전형·과제 테스트 준비에도 활용할 수 있습니다.';

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
    // 도구
    'Playwright',
    'Playwright 연습',
    'Postman',
    'Postman 연습',
    'API 테스트',
    'API 테스트 연습',
    'Selenium 대안',
    'E2E 테스트',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="bg-bg-1 text-text-1 flex min-h-full flex-col">{children}</body>
    </html>
  );
}
