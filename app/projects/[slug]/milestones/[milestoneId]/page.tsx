import React from 'react';
import type { Metadata } from 'next';
import { MilestoneDetailView } from '@/view';

export const metadata: Metadata = {
  title: '마일스톤 상세',
  description: '마일스톤의 진행률, 포함된 테스트 케이스, 실행 이력을 확인합니다.',
};

const Page = () => {
  return <MilestoneDetailView />;
};

export default Page;
