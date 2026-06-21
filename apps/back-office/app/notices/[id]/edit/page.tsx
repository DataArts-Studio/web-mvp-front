import Link from 'next/link';
import { notFound } from 'next/navigation';

import { navItems } from '@/entities/admin-dashboard';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { updateNoticeAction } from '@/features/notices/api/actions';
import { NoticeForm } from '@/view/notices/notice-form';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import { getAnnouncementById } from '@testea/db';

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/notices/${id}/edit`);

  const notice = await getAnnouncementById(id);
  if (!notice) notFound();

  return (
    <BackOfficeLayout
      navItems={navItems}
      activeHref="/notices"
      admin={{ name: '관리자', email: 'admin@testea.com' }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-8">
        <div className="flex flex-col gap-1">
          <Link href="/notices" className="text-text-secondary hover:text-text-primary text-sm">
            ← 공지 목록
          </Link>
          <h1 className="text-text-primary text-2xl font-bold">공지 편집</h1>
        </div>
        <NoticeForm
          action={updateNoticeAction.bind(null, id)}
          initial={notice}
          submitLabel="저장"
        />
      </div>
    </BackOfficeLayout>
  );
}
