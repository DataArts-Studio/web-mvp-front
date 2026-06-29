import type { Metadata } from 'next';

import { SettingsDashboardView } from '@/view/dashboard';

export const metadata: Metadata = {
  title: '계정 설정',
  description: 'qaground 계정과 알림 설정을 관리합니다.',
  robots: { index: false, follow: false },
};

export default function DashboardSettingsPage() {
  return <SettingsDashboardView />;
}
