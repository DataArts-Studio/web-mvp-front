import { ReactNode } from 'react';

import { notFound } from 'next/navigation';

// 페이지가 클라이언트 컴포넌트라 운영 차단은 서버 레이아웃에서 한다(미들웨어와 이중 차단).
export default function SentryExampleLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
