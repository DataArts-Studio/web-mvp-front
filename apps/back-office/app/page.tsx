import {
  type RealDashboardData,
  getDashboardData,
} from '@/entities/admin-dashboard/api/get-dashboard-data';
import { DashboardPage } from '@/pages/dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let data: RealDashboardData | null = null;
  try {
    data = await getDashboardData();
  } catch (error) {
    // DB 불통/지연 시 페이지를 깨뜨리지 않고 실패 UI 로 처리한다.
    console.error('[dashboard] 실데이터 조회 실패', error);
  }
  return <DashboardPage data={data} />;
}
