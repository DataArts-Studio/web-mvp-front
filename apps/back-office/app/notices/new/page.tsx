import Link from 'next/link';

import { navItems } from '@/entities/admin-dashboard';
import { getAdminInfo, requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { createNoticeAction } from '@/features/notices/api/actions';
import { NoticeForm } from '@/view/notices/notice-form';
import { BackOfficeLayout } from '@/widgets/back-office-layout';

export default async function NewNoticePage() {
  await requireAdmin('/notices/new');
  const admin = await getAdminInfo();

  return (
    <BackOfficeLayout navItems={navItems} activeHref="/notices" admin={admin}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-8">
        <div className="flex flex-col gap-1">
          <Link href="/notices" className="text-text-secondary hover:text-text-primary text-sm">
            ← 공지 목록
          </Link>
          <h1 className="text-text-primary text-2xl font-bold">신규 공지</h1>
        </div>
        <NoticeForm action={createNoticeAction} submitLabel="발행" />
      </div>
    </BackOfficeLayout>
  );
}
