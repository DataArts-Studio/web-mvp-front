import type { Metadata } from 'next';

import { PracticeDashboardView } from '@/view/dashboard';

export const metadata: Metadata = {
  title: '내 문제풀이',
  description: 'qaground 문제풀이 내역과 추천 문제를 확인합니다.',
  robots: { index: false, follow: false },
};

export default function DashboardPracticePage() {
  return <PracticeDashboardView />;
}
