import type { Metadata } from 'next';

import { ChallengesView } from '@/view/challenges';

const DESCRIPTION =
  'QA 자동화·API·테스트 케이스 연습 챌린지. 로그인 없이 로그인 폼·결제·게시판 같은 실제형 연습 대상에 Playwright·Postman 테스트를 직접 작성해 실행하고 채점받으세요. QA 과제전형 준비에도 좋습니다.';

export const metadata: Metadata = {
  title: '연습 챌린지',
  description: DESCRIPTION,
  alternates: { canonical: '/challenges' },
  keywords: [
    'QA 연습 챌린지',
    'QA 과제',
    '과제 테스트',
    'Playwright 연습',
    'Postman 연습',
    '테스트 케이스 연습',
    '테스티아',
  ],
  openGraph: {
    title: '연습 챌린지 | qaground',
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com/challenges',
  },
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ChallengesView selectedCategory={category} />;
}
