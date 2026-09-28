import { ReactNode } from 'react';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SESSION_CHECK_HEADER, SESSION_PATH_HEADER } from '@/access/lib/session-headers';
import { getValidAccessToken } from '@/access/policy/access-policy';
import { QueryProvider } from '@/app-shell/providers/query-provider';
import { CommandPalette } from '@/features/command-palette';
import { RouteLoadingProvider } from '@/shared/lib/route-loading';
import { Aside } from '@/widgets/aside';
import { Container } from '@testea/ui';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // 미들웨어는 서명·만료만 확인한다. 비밀번호 변경·프로젝트 삭제로 폐기된 세션은 여기서 DB 와
  // 대조해 접근 페이지로 보낸다. 미들웨어가 보호 경로에서만 헤더를 붙이므로 접근 페이지 자체는
  // 검사하지 않는다(자기 자신으로의 리다이렉트 방지).
  const requestHeaders = await headers();
  if (requestHeaders.get(SESSION_CHECK_HEADER) === '1') {
    const { slug } = await params;
    const projectName = slug;
    if (!(await getValidAccessToken(projectName))) {
      const from =
        requestHeaders.get(SESSION_PATH_HEADER) ?? `/projects/${encodeURIComponent(slug)}`;
      redirect(
        `/projects/${encodeURIComponent(projectName)}/access?redirect=${encodeURIComponent(from)}&expired=true`
      );
    }
  }

  return (
    <QueryProvider>
      <RouteLoadingProvider>
        <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
          <Aside />
          {children}
          <CommandPalette />
        </Container>
      </RouteLoadingProvider>
    </QueryProvider>
  );
}
