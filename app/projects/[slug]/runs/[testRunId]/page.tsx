import React from 'react';
import type { Metadata } from 'next';
import { TestRunDetailView } from '@/view';

export const metadata: Metadata = {
  title: '테스트 실행 상세',
  description: '테스트 실행의 상세 결과와 개별 케이스 실행 상태를 확인합니다.',
};

const Page = () => {
  return <TestRunDetailView />;
};

export default Page;
