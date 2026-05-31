import React from 'react';

import type { Metadata } from 'next';

import { LendingView } from '@/view/lending';

export const metadata: Metadata = {
  title: '테스티아(Testea) - AI 테스트 시나리오·케이스 생성 무료 QA 도구',
  description:
    '요구사항만 입력하면 AI가 테스트 시나리오와 케이스를 만들어주는 무료 QA 도구. 시나리오에서 테스트 스위트 파생, 실행·결과 추적까지 한 곳에서 관리하세요.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '테스티아(Testea) - AI 테스트 시나리오·케이스 생성 무료 QA 도구',
    description:
      '요구사항 기반 AI 시나리오 생성부터 테스트 케이스 작성, 실행, 결과 추적까지. 무료 QA 도구 테스티아로 테스트 관리를 한 곳에서.',
  },
};

const LendingRoute = () => {
  return <LendingView />;
};

export default LendingRoute;
