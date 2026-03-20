import React from 'react';
import type { Metadata } from 'next';
import { LendingView } from '@/view/lending';

export const metadata: Metadata = {
  title: '테스티아(Testea) - 무료 QA 도구 · 테스트 케이스 작성, 단 5분이면 끝!',
  description: '테스티아(Testea) - 무료 QA 도구 · QA 툴. 클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 생성하고 관리하세요. 테스트 관리 도구로 QA 업무를 효율적으로.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '테스티아(Testea) - 무료 QA 도구 · 테스트 관리 플랫폼',
    description: '테스트 케이스 작성부터 실행, 결과 추적까지. 무료 QA 도구 테스티아로 테스트 관리를 한 곳에서.',
  },
};

const LendingRoute = () => {
  return <LendingView/>
};

export default LendingRoute;