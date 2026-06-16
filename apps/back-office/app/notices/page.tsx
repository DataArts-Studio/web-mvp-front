import { navItems } from '@/entities/admin-dashboard';
import { getAdminInfo, requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { NoticesView } from '@/view/notices/notices-view';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { listAnnouncements } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  await requireAdmin('/notices');
  const [items, admin] = await Promise.all([listAnnouncements(), getAdminInfo()]);

  return (
    <BackOfficeLayout navItems={navItems} activeHref="/notices" admin={admin}>
      <NoticesView items={items} />
    </BackOfficeLayout>
  );
}
