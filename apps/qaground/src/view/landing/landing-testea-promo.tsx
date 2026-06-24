export const LandingTesteaPromo = () => {
  return (
    <aside className="bg-bg-2 w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="text-text-2 text-sm">
          <span className="text-text-3">깨알 정보.</span> 연습을 끝냈다면, 실제 프로젝트 QA는{' '}
          <span className="text-primary font-semibold">Testea</span>로 관리하세요.
        </p>
        <a
          href="https://gettestea.com"
          target="_blank"
          rel="noreferrer"
          className="border-line-3 text-text-1 hover:bg-bg-3 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
        >
          Testea 둘러보기
          <span aria-hidden>→</span>
        </a>
      </div>
    </aside>
  );
};
