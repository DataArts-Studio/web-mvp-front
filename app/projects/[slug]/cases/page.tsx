import React from 'react';
import type { Metadata } from 'next';
import { TestCasesView } from '@/view';

export const metadata: Metadata = {
  title: '테스트 케이스',
  description: '프로젝트의 테스트 케이스를 조회하고 관리합니다.',
};

const Page = () => {
  return <TestCasesView/>
};

export default Page;