import React from 'react';
import type { Metadata } from 'next';
import { MilestonesView } from '@/view';

export const metadata: Metadata = {
  title: '마일스톤',
  description: '프로젝트 마일스톤을 관리하고 테스트 진행률을 추적합니다.',
};

const Page = () => {
  return <MilestonesView/>
};

export default Page;