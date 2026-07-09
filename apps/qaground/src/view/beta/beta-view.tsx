import Link from 'next/link';

type BetaViewProps = {
  /** 매직링크 검증으로 확인된 이메일. null 이면 접근 권한 없음. */
  email: string | null;
  /** 검증 실패 사유(missing/invalid/expired). */
  error: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: '접근 토큰이 없습니다. 이메일로 받은 매직링크로 들어와 주세요.',
  invalid: '유효하지 않은 링크입니다. 베타 신청을 다시 해주세요.',
  expired: '링크가 만료되었습니다(30분). 베타 신청을 다시 하면 새 링크를 보내드립니다.',
};

export function BetaView({ email, error }: BetaViewProps) {
  if (!email) {
    return (
      <main className="bg-bg-1 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center text-white">
        <h1 className="text-2xl font-bold">QAground 비공개 베타</h1>
        <p className="max-w-md text-white/70">
          {error
            ? (ERROR_MESSAGES[error] ?? '접근할 수 없습니다.')
            : '이메일로 받은 매직링크로 접근해 주세요.'}
        </p>
        <Link href="/" className="rounded-lg bg-[#0bb57f] px-5 py-2 font-medium text-black">
          홈으로 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-bg-1 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center text-white">
      <h1 className="text-2xl font-bold">QAground 베타에 오신 것을 환영합니다</h1>
      <p className="text-white/80">
        <span className="font-semibold text-[#0bb57f]">{email}</span> 님, 비공개 베타 대기 명단에
        등록되어 있습니다.
      </p>
      <ul className="space-y-2 text-sm text-white/60">
        <li>출시되면 이 이메일로 가장 먼저 안내해 드립니다.</li>
        <li>대기 현황·진행 소식은 준비되는 대로 이 페이지에 표시됩니다.</li>
      </ul>
    </main>
  );
}
