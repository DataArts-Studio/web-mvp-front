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

  // 프로젝트 존재 여부 확인
  const projectExists = await checkProjectExists(slug);
  if (!projectExists) {
    notFound();
  }

  // 이미 접근 권한이 있으면 대시보드로 리다이렉트
  const hasAccess = await canAccessProject(slug);
  if (hasAccess) {
    redirect(redirectUrl || `/projects/${slug}`);
  }

  return (
    <div className="bg-bg-1 flex min-h-screen w-full items-center justify-center px-4">
      <Suspense fallback={<div className="rounded-5 bg-bg-3 h-96 w-full max-w-md animate-pulse" />}>
        <div className="rounded-5 bg-bg-2 shadow-3 border-line-2 w-full max-w-md border p-10">
          <AccessForm projectSlug={slug} redirectUrl={redirectUrl} isExpired={expired === 'true'} />
        </div>
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: '프로젝트 접근',
  description: '프로젝트에 접근하려면 비밀번호를 입력해주세요.',
};
