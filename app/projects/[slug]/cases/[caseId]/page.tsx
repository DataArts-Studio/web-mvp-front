import React from 'react';
import type { Metadata } from 'next';
import { TestCaseDetailView } from '@/view';

export const metadata: Metadata = {
  title: '테스트 케이스 상세',
  description: '테스트 케이스의 상세 정보, 테스트 단계, 예상 결과를 확인합니다.',
};

const Page = () => {
  return <TestCaseDetailView />;
};

export default Page;
