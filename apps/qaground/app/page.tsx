import type { Metadata } from 'next';

import { BetaLandingView } from '@/view/landing-beta';

const TITLE = 'qaground — QA 자동화 연습 플레이그라운드 | 테스티아';
const DESCRIPTION =
  'qaground(큐에이그라운드)는 테스티아(Testea)가 만든 QA 연습 플레이그라운드입니다. 로그인 없이 바로 시작하거나 Testea 계정으로 Playwright·Postman·테스트 케이스 연습 기록 연동을 준비하세요. QA 과제전형·과제 테스트 준비에도 좋습니다.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com',
  },
};

export default function Home() {
  return <BetaLandingView />;
}
