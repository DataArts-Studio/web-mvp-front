/**
 * 프로젝트 접근 페이지
 *
 * 비밀번호 인증이 필요한 프로젝트에 접근하기 위한 게이트 페이지.
 * 인증 성공 시 원래 요청한 페이지로 리다이렉트.
 */
import { Suspense } from 'react';

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { canAccessProject } from '@/access/policy';
import { checkProjectExists } from '@/access/project/api';
import { AccessForm } from '@/access/project/ui';

/**
 * open-redirect 방지: 같은 오리진 내부 경로(`/...`)만 허용.
 * 프로토콜 상대(`//`), 백슬래시 우회(`/\`), 절대 URL(스킴 포함), 제어문자는 거부한다.
 */
function safeInternalPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (!path.startsWith('/')) return undefined;
  if (path.startsWith('//') || path.startsWith('/\\')) return undefined;
  // 제어문자(개행 등) 포함 경로 거부
  for (let i = 0; i < path.length; i++) {
    if (path.charCodeAt(i) < 0x20) return undefined;
  }
  return path;
}

interface AccessPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    redirect?: string;
    expired?: string;
  }>;
}

export default async function ProjectAccessPage({ params, searchParams }: AccessPageProps) {
  const { slug: rawSlug } = await params;
  const { redirect: redirectUrl, expired } = await searchParams;

  // URL 인코딩된 slug 디코딩
  const slug = decodeURIComponent(rawSlug);

  // open-redirect 방지: 내부 경로로 검증된 값만 사용
  const safeRedirect = safeInternalPath(redirectUrl);

  // 프로젝트 존재 여부 확인
  const projectExists = await checkProjectExists(slug);
  if (!projectExists) {
    notFound();
  }

  // 이미 접근 권한이 있으면 대시보드로 리다이렉트
  const hasAccess = await canAccessProject(slug);
  if (hasAccess) {
    redirect(safeRedirect ?? `/projects/${slug}`);
  }

  return (
    <div className="bg-bg-1 flex min-h-screen w-full items-center justify-center px-4">
      <Suspense fallback={<div className="rounded-5 bg-bg-3 h-96 w-full max-w-md animate-pulse" />}>
        <div className="rounded-5 bg-bg-2 shadow-3 border-line-2 w-full max-w-md border p-10">
          <AccessForm
            projectSlug={slug}
            redirectUrl={safeRedirect}
            isExpired={expired === 'true'}
          />
        </div>
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: '프로젝트 접근',
  description: '프로젝트에 접근하려면 비밀번호를 입력해주세요.',
};
