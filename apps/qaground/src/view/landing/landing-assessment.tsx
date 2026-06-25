const POINTS = [
  '실제 시나리오 기반 과제 출제',
  '제출 코드 자동 실행·채점',
  '응시자 객관 비교 리포트',
];

export const LandingAssessment = () => {
  return (
    <section id="assessment" className="w-full py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-primary/30 from-primary/10 relative overflow-hidden rounded-3xl border bg-gradient-to-br to-transparent p-8 sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl flex-col gap-4">
              <span className="text-primary text-sm font-semibold">기업용 · 과제전형</span>
              <h2 className="text-2xl font-bold sm:text-3xl">
                QA 채용, 말 대신 <span className="text-primary">실행 결과</span>로 검증하세요
              </h2>
              <p className="text-text-2 text-sm leading-relaxed sm:text-base">
                후보에게 실제 시나리오를 주고, 제출한 자동화 코드를 자동으로 실행·채점합니다. 면접
                감에 의존하지 않고 같은 기준으로 비교한 리포트를 받아 보세요.
              </p>
              <ul className="mt-1 flex flex-col gap-2">
                {POINTS.map((p) => (
                  <li key={p} className="text-text-1 flex items-center gap-2 text-sm">
                    <span className="text-primary">●</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="mailto:hello@gettestea.com?subject=qaground 과제전형 도입 문의"
              className="border-line-3 rounded-button h-button-lg text-text-1 hover:bg-bg-3 inline-flex shrink-0 items-center justify-center border px-8 font-medium transition-colors"
            >
              도입 문의
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
