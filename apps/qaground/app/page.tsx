import type { Metadata } from 'next';

import { BetaLandingView } from '@/view/landing-beta';

export const metadata: Metadata = {
  title: 'qaground — QA 자동화 연습 플레이그라운드 (비공개 베타)',
  description: 'QA 자동화 연습 플레이그라운드 qaground. 비공개 베타 신청.',
};

export default function Home() {
  return <BetaLandingView />;
}
