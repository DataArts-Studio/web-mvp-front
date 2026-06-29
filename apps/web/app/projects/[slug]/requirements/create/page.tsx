import type { Metadata } from 'next';

import { RequirementsView } from '@/view';

export const metadata: Metadata = {
  title: '요구사항 생성',
  description: '요구사항 문서를 정리하고 테스트 시나리오로 이어지는 작업을 생성합니다.',
};

export default function Page() {
  return <RequirementsView openCreateOnMount />;
}
