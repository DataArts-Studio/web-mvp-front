const DIFFERENTIATORS = [
  '연습 페이지 제공',
  '내 코드 실행',
  '자동 채점',
  '개선 피드백',
  '진척 추적',
];

export const LandingHero = () => {
  return (
    <section id="top" className="relative w-full overflow-hidden">
      {/* 배경 그라데이션 */}
      <div
        aria-hidden
        className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 sm:py-32">
        <span className="border-line-2 bg-bg-2 text-text-2 animate-fade-in-up inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
          QA 자동화 연습 플랫폼 · 비공개 베타 준비 중
        </span>

        <h1 className="animate-fade-in-up text-4xl leading-[130%] font-bold tracking-tight sm:text-5xl md:text-6xl">
          작성한 테스트를
          <br />
          <span className="text-primary">진짜로 실행하고 채점받는</span>
          <br />
          QA 연습 플레이그라운드
        </h1>

        <p className="animate-fade-in-up-delay text-text-2 max-w-2xl text-base leading-[170%] sm:text-lg">
          로그인 폼부터 동적 테이블, 가짜 API까지. 연습용 페이지에 직접 Playwright·Cypress 테스트를
          작성해 제출하면, 격리된 러너가 실행하고 어디서 틀렸는지 알려줍니다.
        </p>

        <div className="animate-fade-in-up-delay-2 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#playground"
            className="bg-primary rounded-button h-button-lg hover:bg-primary/90 active:bg-primary/80 inline-flex w-full items-center justify-center px-8 font-medium text-white transition-colors sm:w-auto"
          >
            연습 시작하기
          </a>
          <a
            href="#how"
            className="border-line-3 rounded-button h-button-lg text-text-1 hover:bg-bg-3 inline-flex w-full items-center justify-center border px-8 font-medium transition-colors sm:w-auto"
          >
            작동 방식 보기
          </a>
        </div>

        <ul className="animate-fade-in-up-delay-2 text-text-3 mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          {DIFFERENTIATORS.map((d) => (
            <li key={d} className="flex items-center gap-1.5">
              <span className="text-primary">●</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
