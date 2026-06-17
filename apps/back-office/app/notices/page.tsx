import { navItems } from '@/entities/admin-dashboard';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { NoticesView } from '@/view/notices/notices-view';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { listAnnouncements } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  await requireAdmin('/notices');
  const items = await listAnnouncements();

  return (
    <BackOfficeLayout
      navItems={navItems}
      activeHref="/notices"
      admin={{ name: '관리자', email: 'admin@testea.com' }}
    >
      <NoticesView items={items} />
    </BackOfficeLayout>
  );
}
