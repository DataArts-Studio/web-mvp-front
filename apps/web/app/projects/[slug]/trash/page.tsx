import React from 'react';
import type { Metadata } from 'next';
import { TrashView } from '@/view';

export const metadata: Metadata = {
  title: '휴지통',
  description: '삭제된 항목을 확인하고 복원하거나 영구 삭제할 수 있습니다.',
};

const Page = () => {
  return <TrashView />;
};

export default Page;
