import React from 'react';

import type { Metadata } from 'next';

import { MilestoneCreateView } from '@/view/project/milestones/create';

export const metadata: Metadata = {
  title: '마일스톤 생성',
  description: '새로운 마일스톤을 생성하고 테스트 케이스와 스위트를 연결합니다.',
};

const Page = () => {
  return <MilestoneCreateView />;
};

export default Page;
