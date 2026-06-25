const ROWS = [
  { label: '연습 대상 페이지', legacy: true, qaground: true },
  { label: '내 테스트 코드 실행', legacy: false, qaground: true },
  { label: '통과/실패 자동 채점', legacy: false, qaground: true },
  { label: '어디서 틀렸는지 피드백', legacy: false, qaground: true },
  { label: '학습 진척·수료 인증', legacy: false, qaground: true },
  { label: '기업 채용 과제전형', legacy: false, qaground: true },
];

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="text-primary font-semibold">있음</span>
  ) : (
    <span className="text-text-4">없음</span>
  );
}

export const LandingComparison = () => {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          연습 페이지만 주는 곳과는 <span className="text-primary">다릅니다</span>
        </h2>
        <p className="text-text-2 mt-3 text-center text-sm leading-relaxed">
          대부분의 QA 연습 사이트는 페이지만 제공합니다. qaground는 실행하고, 채점하고, 길을
          알려줍니다.
        </p>

        <div className="border-line-2 bg-bg-2 mt-10 overflow-hidden rounded-2xl border">
          <div className="border-line-2 text-text-3 grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-3 text-xs sm:px-6">
            <span></span>
            <span className="w-20 text-center">기존 사이트</span>
            <span className="w-20 text-center">qaground</span>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="border-line-2 grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-5 py-4 text-sm last:border-b-0 sm:px-6"
            >
              <span className="text-text-1">{row.label}</span>
              <span className="w-20 text-center text-sm">
                <Mark on={row.legacy} />
              </span>
              <span className="w-20 text-center text-sm">
                <Mark on={row.qaground} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
