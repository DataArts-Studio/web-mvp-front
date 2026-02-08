import React from 'react';
import type { Metadata } from 'next';
import { TestRunsListView } from '@/view';

export const metadata: Metadata = {
  title: '테스트 실행',
  description: '테스트 실행 목록을 조회하고 실행 결과를 관리합니다.',
};

const Page = () => {
  return <TestRunsListView/>
};

export default Page;