import { redirect } from 'next/navigation';

import { isAdminAuthed } from '@/features/auth-gate/lib/admin-gate';
import { GateForm } from '@/view/notices/gate-form';

/** 운영자 공유키 입력 게이트. 이미 인증됐으면 목록으로 보낸다. */
export default async function NoticeGatePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : '/notices';

  if (await isAdminAuthed()) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-text-1 text-xl font-bold">운영 공지 관리</h1>
          <p className="text-text-3 text-sm">운영자 키를 입력해 입장하세요.</p>
        </div>
        <GateForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
