import type { Metadata } from 'next';

import { ChallengesView } from '@/view/challenges';

export const metadata: Metadata = {
  title: '연습 챌린지 — qaground',
  description: 'QA 자동화 연습 챌린지. 로그인 없이 연습 대상에 직접 테스트를 작성해 보세요.',
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ChallengesView selectedCategory={category} />;
}
