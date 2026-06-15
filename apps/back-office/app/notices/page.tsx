import Link from 'next/link';

import { signOutAdminAction } from '@/features/auth-gate/api/gate-actions';
import { requireAdmin } from '@/features/auth-gate/lib/admin-gate';
import { Button } from '@/shared/ui/button';
import { NoticesListView } from '@/view/notices/notices-list-view';
import { listAnnouncements } from '@testea/db';

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  await requireAdmin('/notices');
  const items = await listAnnouncements();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-1 text-2xl font-bold">운영 공지·배너</h1>
          <p className="text-text-3 text-sm">web 앱 사용자에게 노출되는 공지를 발행·관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="text-text-3 hover:text-text-1 rounded-button px-3 py-2 text-sm"
            >
              로그아웃
            </button>
          </form>
          <Link href="/notices/new">
            <Button size="medium">신규 공지</Button>
          </Link>
        </div>
      </header>

      <NoticesListView items={items} />
    </main>
  );
}
