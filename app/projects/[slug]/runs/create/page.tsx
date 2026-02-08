import React from 'react';
import type { Metadata } from 'next';
import { RunCreateView } from '@/view/project/runs/create';

export const metadata: Metadata = {
  title: '테스트 실행 생성',
  description: '새로운 테스트 실행을 생성하고 테스트 범위를 설정합니다.',
};

const Page = () => {
  return <RunCreateView />;
};

export default Page;
