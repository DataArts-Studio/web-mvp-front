import type { Metadata } from 'next';
import TestSuiteDetailView from '@/view/project/suites/test-suite-detail-view';

export const metadata: Metadata = {
  title: '테스트 스위트 상세',
  description: '테스트 스위트의 상세 정보와 포함된 테스트 케이스를 확인합니다.',
};

const SuiteDetailPage = () => {
  return <TestSuiteDetailView />;
};

export default SuiteDetailPage;
