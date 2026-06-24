const STEPS = [
  {
    no: '1',
    title: '연습 페이지 선택',
    desc: '난도와 도구(Playwright·Cypress·Selenium)에 맞는 연습 대상 페이지를 고릅니다.',
  },
  {
    no: '2',
    title: '테스트 작성·제출',
    desc: '해당 페이지를 검증하는 자동화 테스트를 직접 작성해 제출합니다.',
  },
  {
    no: '3',
    title: '실행·채점·피드백',
    desc: '격리된 러너가 코드를 실행하고, 통과/실패와 함께 개선할 점을 알려줍니다.',
  },
];

export const LandingHowItWorks = () => {
  return (
    <section id="how" className="w-full py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          어떻게 <span className="text-primary">작동하나요</span>
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.no} className="flex flex-col gap-4">
              <span className="bg-bg-3 text-primary flex h-10 w-10 items-center justify-center rounded-full text-base font-bold">
                {s.no}
              </span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
