import React from 'react';
import type { Metadata } from 'next';
import { SettingsView } from '@/view/project';

export const metadata: Metadata = {
  title: '프로젝트 설정',
  description: '프로젝트 설정을 관리합니다.',
};

const Page = () => {
  return <SettingsView />;
};

export default Page;