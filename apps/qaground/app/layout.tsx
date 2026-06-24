import type { Metadata } from 'next';

import '@/app-shell/globals.css';

export const metadata: Metadata = {
  title: 'qaground — QA 자동화 연습 플레이그라운드',
  description:
    'QA 엔지니어를 위한 자동화 테스트 연습 그라운드. 직접 작성한 테스트를 실행하고 채점받으세요.',
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
