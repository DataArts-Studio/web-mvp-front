export const LandingFooter = () => {
  return (
    <footer className="border-line-2 w-full border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <span className="text-base font-bold tracking-tight">
            qa<span className="text-primary">ground</span>
          </span>
          <span className="text-text-3 text-xs">
            QA 자동화 연습과 채용 과제전형. Testea 제품군.
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <a
            href="https://gettestea.com"
            className="text-text-2 hover:text-text-1 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            Testea 알아보기
          </a>
          <a href="#how" className="text-text-2 hover:text-text-1 transition-colors">
            작동 방식
          </a>
          <a href="#assessment" className="text-text-2 hover:text-text-1 transition-colors">
            과제전형
          </a>
        </nav>
      </div>
      <div className="border-line-2 border-t">
        <div className="text-text-4 mx-auto w-full max-w-6xl px-4 py-5 text-xs sm:px-6">
          © 2026 Testea. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
