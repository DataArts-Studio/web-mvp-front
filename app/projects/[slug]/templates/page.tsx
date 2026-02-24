import React from 'react';
import type { Metadata } from 'next';
import { TemplatesView } from '@/view';

export const metadata: Metadata = {
  title: '템플릿 관리',
  description: '테스트 케이스 템플릿을 관리하고 재사용합니다.',
};

const Page = () => {
  return <TemplatesView />;
};

export default Page;
