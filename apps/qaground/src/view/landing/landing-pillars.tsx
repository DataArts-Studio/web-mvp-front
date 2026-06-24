const PILLARS = [
  {
    no: '01',
    title: '연습 플레이그라운드',
    desc: '로그인, 폼 검증, 동적 테이블, 드래그앤드롭, 파일 업로드, 가짜 REST API까지. 자동화 연습에 필요한 페이지를 난도별로 제공합니다.',
  },
  {
    no: '02',
    title: '자동 실행·채점',
    desc: '제출한 Playwright·Cypress 스펙을 격리된 러너에서 실행하고, 숨겨진 검증 기준으로 통과/실패를 채점합니다.',
  },
  {
    no: '03',
    title: '학습 경로·인증',
    desc: '난도별 과제와 추천 학습 경로, 진행률 추적, 수료 배지로 실력이 쌓이는 과정을 눈에 보이게 만듭니다.',
  },
  {
    no: '04',
    title: '채용 과제전형',
    desc: '기업은 실제 시나리오로 과제를 출제하고, 후보가 제출한 자동화 코드를 자동 채점해 객관적 리포트로 비교합니다.',
  },
];

export const LandingPillars = () => {
  return (
    <section id="playground" className="w-full py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          연습부터 채용 평가까지, <span className="text-primary">한 곳에서</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <article
              key={p.no}
              className="border-line-2 bg-bg-2 hover:border-line-3 flex flex-col gap-3 rounded-2xl border p-6 transition-colors sm:p-8"
            >
              <span className="text-primary text-sm font-semibold">{p.no}</span>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
