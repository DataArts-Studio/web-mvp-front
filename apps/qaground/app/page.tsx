import type { Metadata } from 'next';

import { BetaLandingView } from '@/view/landing-beta';

const TITLE = 'qaground — 로그인 없이 시작하는 QA 자동화 연습 | 테스티아';
const DESCRIPTION =
  'qaground(큐에이그라운드)는 테스티아(Testea)가 만든 QA 연습 플레이그라운드입니다. 로그인 없이 바로 Playwright·Postman·테스트 케이스 연습을 시작하세요. QA 과제전형·과제 테스트 준비에도 좋습니다.';

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
