import {
  type RealDashboardData,
  getDashboardData,
} from '@/entities/admin-dashboard/api/get-dashboard-data';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { DashboardPage } from '@/pages/dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 다른 페이지와 동일한 인증 가드. 누락 시 미인증으로 운영 지표가 노출됨(+ Hyperdrive DB 주입도 겸함).
  await requireAdmin('/');

  let data: RealDashboardData | null = null;
  try {
    data = await getDashboardData();
  } catch (error) {
    // DB 불통/지연 시 페이지를 깨뜨리지 않고 실패 UI 로 처리한다.
    console.error('[dashboard] 실데이터 조회 실패', error);
  }
  return <DashboardPage data={data} />;
}
