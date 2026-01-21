import React, {ReactNode} from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '@/app-shell/styles/globals.css';
import { MvpBottomNavbar } from 'src/shared';

import { QueryProvider } from '../src/app-shell/providers/query-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Testea - 테스트 관리 플랫폼',
    template: '%s | Testea',
  },
  description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼. 테스트 계획, 실행, 결과 추적을 한 곳에서.',
  keywords: ['테스트 관리', 'QA', '테스트 케이스', '품질 관리', 'test management'],
  authors: [{ name: 'Testea' }],
  openGraph: {
    title: 'Testea - 테스트 관리 플랫폼',
    description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Testea',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Testea - 테스트 관리 플랫폼',
    description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        {/* 테스트용 컴포넌트 */}
        <MvpBottomNavbar />
      </body>
    </html>
  );
}
