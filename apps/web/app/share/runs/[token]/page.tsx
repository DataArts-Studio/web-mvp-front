import type { Metadata } from 'next';
import { SharedReportView } from '@/view/share/shared-report-view';

export const metadata: Metadata = {
  title: '테스트 실행 리포트',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedReportPage({ params }: PageProps) {
  const { token } = await params;
  return <SharedReportView token={token} />;
}
