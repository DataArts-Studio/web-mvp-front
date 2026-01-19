/**
 * 프로젝트 접근 페이지
 *
 * 비밀번호 인증이 필요한 프로젝트에 접근하기 위한 게이트 페이지.
 * 인증 성공 시 원래 요청한 페이지로 리다이렉트.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AccessForm } from '@/access/project/ui';
import { canAccessProject } from '@/access/policy';

interface AccessPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    redirect?: string;
    expired?: string;
  }>;
}

export default async function ProjectAccessPage({
  params,
  searchParams,
}: AccessPageProps) {
  const { slug } = await params;
  const { redirect: redirectUrl, expired } = await searchParams;

  // 이미 접근 권한이 있으면 대시보드로 리다이렉트
  const hasAccess = await canAccessProject(slug);
  if (hasAccess) {
    redirect(redirectUrl || `/projects/${slug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-1 px-4">
      <Suspense
        fallback={
          <div className="h-96 w-full max-w-md animate-pulse rounded-5 bg-bg-3" />
        }
      >
        <div className="w-full max-w-md rounded-5 bg-bg-2 p-10 shadow-3 border border-line-2">
          <AccessForm
            projectSlug={slug}
            redirectUrl={redirectUrl}
            isExpired={expired === 'true'}
          />
        </div>
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: '프로젝트 접근',
  description: '프로젝트에 접근하려면 비밀번호를 입력해주세요.',
};
