import type { Metadata } from 'next';

import { ScenarioFeaturesView } from '@/view';

export const metadata: Metadata = {
  title: '시나리오 관리',
  description: '기능(요구사항)별로 테스트 시나리오를 작성하고 관리합니다.',
};

export default function Page() {
  return <ScenarioFeaturesView />;
}
