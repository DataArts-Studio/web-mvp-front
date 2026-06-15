import Link from 'next/link';

import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { createNoticeAction } from '@/features/notices/api/actions';
import { NoticeForm } from '@/view/notices/notice-form';

export default async function NewNoticePage() {
  await requireAdmin('/notices/new');

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link href="/notices" className="text-text-3 hover:text-text-1 text-sm">
          ← 공지 목록
        </Link>
        <h1 className="text-text-1 text-2xl font-bold">신규 공지</h1>
      </div>
      <NoticeForm action={createNoticeAction} submitLabel="발행" />
    </main>
  );
}
