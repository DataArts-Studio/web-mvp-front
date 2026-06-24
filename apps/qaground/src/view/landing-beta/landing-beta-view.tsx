import { WaitlistForm } from './waitlist-form';

export const BetaLandingView = () => {
  return (
    <div className="bg-bg-1 text-text-1 relative flex h-screen w-full flex-col overflow-hidden font-sans">
      {/* 배경 그라데이션 */}
      <div
        aria-hidden
        className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent"
      />

      {/* 헤더 */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">
            qa<span className="text-primary">ground</span>
          </span>
          <a
            href="https://gettestea.com"
            target="_blank"
            rel="noreferrer"
            className="text-text-3 hover:text-text-2 text-xs transition-colors"
          >
            by Testea
          </a>
        </div>
        <span className="border-line-2 bg-bg-2 text-text-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          비공개 베타
        </span>
      </header>

      {/* 본문 (중앙 정렬) */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 px-6 text-center">
        <h1 className="text-4xl leading-[130%] font-bold tracking-tight sm:text-5xl md:text-6xl">
          작성한 테스트를
          <br />
          <span className="text-primary">실행하고 채점받는</span>
          <br />
          QA 연습 플레이그라운드
        </h1>
        <p className="text-text-2 max-w-xl text-base leading-[170%] sm:text-lg">
          곧 공개됩니다. 가장 먼저 연습을 시작하고 싶다면 베타를 신청하세요.
        </p>
        <WaitlistForm />
      </main>

      {/* 푸터 */}
      <footer className="relative z-10 flex shrink-0 flex-col items-center gap-2 px-6 py-5 text-center">
        <a
          href="https://gettestea.com"
          target="_blank"
          rel="noreferrer"
          className="text-text-3 hover:text-text-1 text-xs transition-colors"
        >
          실제 프로젝트 QA는 Testea로 관리하세요 →
        </a>
        <span className="text-text-4 text-xs">© 2026 Testea</span>
      </footer>
    </div>
  );
};
