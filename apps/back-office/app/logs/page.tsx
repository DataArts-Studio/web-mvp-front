import { navItems } from '@/entities/admin-dashboard';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { AdminLogView } from '@/view/admin-log/admin-log-view';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { listAdminActivity } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  await requireAdmin('/logs');
  // 로그인 실패는 누구나 쌓을 수 있으므로 관리자 활동과 따로 가져와 합친다. 한 목록으로 받으면
  // 실패 기록이 실제 관리자 활동을 페이지 밖으로 밀어낸다.
  const [actions, failures] = await Promise.all([
    listAdminActivity(100, { excludeActions: ['login.failed'] }),
    listAdminActivity(50, { actions: ['login.failed'] }),
  ]);
  const logs = [...actions, ...failures].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
