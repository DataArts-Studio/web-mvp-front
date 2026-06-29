import type { Metadata } from 'next';

import { DashboardView } from '@/view/dashboard';

export const metadata: Metadata = {
  title: '대시보드',
  description: 'qaground 풀이 기록과 계정 활동을 확인합니다.',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardView />;
}
