import type { Metadata } from 'next';

import { TestSuitesView } from '@/view';

export const metadata: Metadata = {
  title: '테스트 스위트',
  description: '테스트 스위트를 관리하고 케이스를 그룹별로 구성합니다.',
};

export default function Page() {
  return <TestSuitesView />;
}
