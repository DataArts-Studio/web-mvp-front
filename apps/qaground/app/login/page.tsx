import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/features/auth';
import { PlaygroundHeader } from '@/view/challenges/playground-header';

export const metadata: Metadata = {
  title: '로그인',
  description: 'Testea 계정으로 qaground에 로그인합니다.',
};

function getSafeNextPath(next?: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  if (next.startsWith('/login')) return '/dashboard';
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next);
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-5xl" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_24rem] lg:items-center">
          <section>
            <Link
              href="/challenges"
              className="text-text-3 hover:text-text-1 text-sm transition-colors"
            >
              ← 챌린지로 돌아가기
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              하나의 Testea 계정으로
              <br /> qaground 풀이 기록을 이어갑니다.
            </h2>
            <p className="text-text-2 mt-4 max-w-xl text-sm leading-relaxed">
              지금은 로그인 기반 기록 저장을 위한 준비 단계입니다. 배포 전까지는 기능을 원격
              브랜치에만 올려두고, Testea 로그인과 같은 Supabase Auth 설정을 공유합니다.
            </p>
          </section>
          <LoginForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
