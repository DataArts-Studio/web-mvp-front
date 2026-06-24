const PILLARS = [
  {
    label: '플레이그라운드',
    desc: '로그인, 폼, 테이블, 드래그앤드롭, 가짜 API 등 자동화 연습용 페이지',
  },
  {
    label: '자동 실행·채점',
    desc: '제출한 Playwright/Cypress 스펙을 격리 러너에서 실행하고 통과/실패 채점',
  },
  {
    label: '학습 경로·인증',
    desc: '난도별 과제, 진행률 추적, 수료 배지',
  },
  {
    label: '과제전형',
    desc: '기업이 QA 채용 과제를 출제하고 자동 채점 리포트를 받는 B2B 평가',
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-6 py-20">
      <header className="flex flex-col gap-4">
        <span className="text-primary text-sm font-semibold tracking-tight">
          qaground.gettestea.com
        </span>
        <h1 className="text-3xl font-bold">
          QA 자동화를 <span className="text-primary">직접 돌려보며</span> 연습하는 곳
        </h1>
        <p className="text-text-2 text-base">
          연습 페이지만 주는 곳이 아닙니다. 작성한 테스트를 실행하고, 채점하고, 어디서 틀렸는지
          알려줍니다. 기업은 같은 엔진으로 채용 과제전형을 돌립니다.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <li
            key={p.label}
            className="border-line-2 bg-bg-2 flex flex-col gap-2 rounded-xl border border-solid p-5"
          >
            <span className="font-semibold">{p.label}</span>
            <span className="text-text-2 text-sm">{p.desc}</span>
          </li>
        ))}
      </ul>

      <footer className="text-text-3 text-xs">
        스캐폴딩 단계. 기능 정리: docs/issues/qaground
      </footer>
    </main>
  );
}
