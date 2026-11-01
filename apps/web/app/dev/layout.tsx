import { ReactNode } from 'react';

import { notFound } from 'next/navigation';

import { QueryProvider } from '@/app-shell/providers/query-provider';

export default function DevLayout({ children }: { children: ReactNode }) {
  // 미들웨어도 막지만, matcher 가 바뀌어도 운영 빌드에서 열리지 않도록 라우트에서도 막는다.
  if (process.env.NODE_ENV === 'production') notFound();
  return <QueryProvider>{children}</QueryProvider>;
}
