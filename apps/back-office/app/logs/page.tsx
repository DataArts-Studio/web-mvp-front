import { navItems } from '@/entities/admin-dashboard';
import { getAdminInfo, requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { AdminLogView } from '@/view/admin-log/admin-log-view';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { listAdminActivity } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  await requireAdmin('/logs');
  const [logs, admin] = await Promise.all([listAdminActivity(100), getAdminInfo()]);

  return (
    <BackOfficeLayout navItems={navItems} activeHref="/logs" admin={admin}>
      <AdminLogView logs={logs} />
    </BackOfficeLayout>
  );
}
