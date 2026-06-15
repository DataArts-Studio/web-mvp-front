import { getDashboardData } from '@/entities/admin-dashboard/api/get-dashboard-data';
import { DashboardPage } from '@/pages/dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getDashboardData();
  return <DashboardPage data={data} />;
}
