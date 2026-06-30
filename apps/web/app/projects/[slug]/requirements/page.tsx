import type { Metadata } from 'next';

import { RequirementsView } from '@/view';

export const metadata: Metadata = {
  title: '요구사항 생성',
  description: 'AI로 요구사항 분석서와 테스트 시나리오를 생성하고 목록을 관리합니다.',
};

export default function Page() {
  return <RequirementsView />;
}
