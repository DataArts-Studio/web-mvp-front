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
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
      <div className="border-border flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="tracking-zero text-text-primary text-xl font-bold">Testea</div>
          <h1 className="text-text-primary text-lg font-bold">공지 및 배너 관리</h1>
          <p className="text-text-secondary text-sm">운영자 키를 입력해 입장하세요.</p>
        </div>
        <GateForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
