import { navItems } from '@/entities/admin-dashboard';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { AdminLogView } from '@/view/admin-log/admin-log-view';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { listAdminActivity } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  await requireAdmin('/logs');
  const logs = await listAdminActivity(100);

  return (
    <BackOfficeLayout
      navItems={navItems}
      activeHref="/logs"
      admin={{ name: '관리자', email: 'admin@testea.com' }}
    >
      <AdminLogView logs={logs} />
    </BackOfficeLayout>
  );
}
