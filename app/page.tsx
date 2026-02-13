import React from 'react';
import type { Metadata } from 'next';
import { LendingView } from '@/view/lending';

export const metadata: Metadata = {
  title: 'Testea - 테스트 케이스 작성, 단 5분이면 끝!',
  description: '클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 생성하고 관리해보세요. 무료 테스트 도구 · QA 툴로 테스트 케이스 관리와 협업을 한 곳에서.',
  alternates: {
    canonical: '/',
  },
};

const LendingRoute = () => {
  return <LendingView/>
};

export default LendingRoute;