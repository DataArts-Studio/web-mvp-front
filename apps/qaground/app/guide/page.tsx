import type { Metadata } from 'next';
import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { GuideToc } from '@/view/guide/guide-toc';

const DESCRIPTION =
  'qaground 사용 가이드. 자동화(Playwright)·메뉴얼(테스트 케이스·결함 리포트)·API(Postman)·성능·접근성 트랙이 무엇인지, 챌린지를 어떻게 풀고 채점받는지, 셀렉터·단언·좋은 테스트 케이스 작성법까지 한 번에 정리했습니다.';

export const metadata: Metadata = {
  title: '가이드',
  description: DESCRIPTION,
  alternates: { canonical: '/guide' },
  keywords: [
    'QA 연습 가이드',
    'Playwright 입문',
    'Postman API 테스트',
    '테스트 케이스 작성법',
    '셀렉터 전략',
    'QA 과제전형 준비',
    '테스티아',
  ],
  openGraph: {
    title: '가이드 | qaground',
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com/guide',
  },
};

// 히어로 제품 목업: 실제 채점 콘솔 미리보기.
const DEMO_LINES: { text: string; cls: string }[] = [
  { text: '$ qaground grade --testcases', cls: 'text-[#8b949e]' },
  { text: '요구사항 3개에 대한 케이스 내용을 검토합니다', cls: 'text-[#8b949e]' },
  { text: '  ✓  요구 1 — 충족', cls: 'text-[#3fb950]' },
  { text: '  ✓  요구 2 — 충족', cls: 'text-[#3fb950]' },
  { text: '  ✓  요구 3 — 충족', cls: 'text-[#3fb950]' },
  { text: '  통과 — 요구사항 3개 모두 충족', cls: 'text-[#3fb950] font-bold' },
];

const TRACKS = [
  {
    tag: 'AUTO',
    bar: 'bg-[#3fb950]',
    text: 'text-[#3fb950]',
    title: '자동화 · Playwright',
    desc: '실제형 화면에 UI 테스트를 작성합니다. 작성한 단언이 통과하면 합격이고, 러너가 연결되면 실제 브라우저로 실행해 채점합니다.',
  },
  {
    tag: 'MANUAL',
    bar: 'bg-[#d29922]',
    text: 'text-[#d29922]',
    title: '메뉴얼 · 테스트 설계',
    desc: '요구사항을 분석해 케이스를 설계하거나 심어둔 결함을 찾아 리포트합니다. 요구사항 충족 여부로 채점하고 모범 답안과 맞춰 봅니다.',
  },
  {
    tag: 'API',
    bar: 'bg-[#58a6ff]',
    text: 'text-[#58a6ff]',
    title: 'API · Postman 스타일',
    desc: '요청을 구성하고 상태 코드·JSON·pm.test로 응답을 검증합니다. 브라우저 안에서 실제로 요청을 보내 바로 채점됩니다.',
  },
  {
    tag: 'PERF',
    bar: 'bg-[#a371f7]',
    text: 'text-[#a371f7]',
    title: '성능 · Web Vitals',
    desc: 'Core Web Vitals와 리소스 병목을 측정하고, 재현 가능한 성능 리포트와 개선 우선순위를 정리합니다.',
  },
  {
    tag: 'A11Y',
    bar: 'bg-[#f778ba]',
    text: 'text-[#f778ba]',
    title: '접근성 · Keyboard & Screen Reader',
    desc: '키보드 탐색, 포커스 표시, 라벨·에러 전달, 색 대비처럼 실제 사용성에 영향을 주는 접근성 문제를 점검합니다.',
  },
];

const STEPS = [
  ['요구사항 읽기', '상단의 요구사항이 곧 검증 목표입니다. 무엇을 확인할지부터 잡습니다.'],
  ['연습 대상 열기', '샌드박스나 API 엔드포인트의 구조와 셀렉터를 먼저 살핍니다.'],
  ['테스트 작성', '정상 경로만이 아니라 경계와 예외까지 직접 설계해 작성합니다.'],
  ['제출과 보완', '요구사항별 채점 결과와 모범 답안·피드백으로 빠진 곳을 메웁니다.'],
];

const Terminal = ({ label, children }: { label: string; children: string }) => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <span className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]/80" />
      </span>
      <span className="font-mono text-[11px] tracking-wide text-[#8b949e]">{label}</span>
    </div>
    <pre className="overflow-auto px-4 py-4 font-mono text-xs leading-[1.7] text-[#c9d1d9]">
      {children}
    </pre>
  </div>
);

const TOC = [
  ['01', '다섯 가지 트랙', 'tracks'],
  ['02', '푸는 흐름', 'flow'],
  ['03', '채점 방식', 'grading'],
  ['04', '셀렉터 전략', 'selector'],
  ['05', '응답 검증', 'api'],
  ['06', '좋은 테스트 케이스', 'cases'],
];

const Section = ({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="border-line-2 scroll-mt-20 border-t pt-12">
    <div className="flex items-baseline gap-3">
      <span className="text-primary font-mono text-sm font-semibold">{n}</span>
      <h2 className="text-text-1 text-2xl font-bold tracking-tight">{title}</h2>
    </div>
    <div className="text-text-2 mt-5 text-[15px] leading-relaxed">{children}</div>
  </section>
);

export default function GuidePage() {
  return (
    <div className="bg-bg-1 text-text-1 min-h-screen font-sans">
      <PlaygroundHeader containerClassName="max-w-5xl" />

      <div className="mx-auto flex w-full max-w-5xl gap-12 px-6 pt-14 pb-24">
        <main className="max-w-3xl min-w-0 flex-1">
          {/* 문서 머리 */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">qaground 가이드</h1>
          <p className="text-text-2 mt-4 text-base leading-relaxed">
            이 문서는 qaground의 트랙 구성, 챌린지를 푸는 흐름, 채점 방식, 그리고 테스트 작성
            기본기를 안내합니다. 처음이라면 위에서부터 차례로 읽어 보세요.
          </p>

          <div className="mt-14 flex flex-col gap-16">
            {/* 트랙 */}
            <Section id="tracks" n="01" title="다섯 가지 트랙">
              <p className="text-text-3">
                관심사와 도구로 고르세요. 한 챌린지는 한 트랙에 속합니다.
              </p>
              <div className="mt-6 flex flex-col gap-6">
                {TRACKS.map((t) => (
                  <div key={t.title} className="flex gap-4">
                    <span className={`mt-1 w-[3px] shrink-0 self-stretch rounded-full ${t.bar}`} />
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-[11px] font-bold tracking-wider ${t.text}`}
                        >
                          {t.tag}
                        </span>
                        <h3 className="text-text-1 text-base font-semibold">{t.title}</h3>
                      </div>
                      <p className="text-text-2 mt-1.5 text-sm leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 흐름 */}
            <Section id="flow" n="02" title="푸는 흐름">
              <div className="flex flex-col">
                {STEPS.map(([title, desc], i) => (
                  <div
                    key={title}
                    className="border-line-2 flex gap-5 border-b py-5 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span className="text-text-3/50 w-8 shrink-0 font-mono text-3xl leading-none font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <div className="pt-1">
                      <span className="text-text-1 text-base font-semibold">{title}</span>
                      <p className="text-text-2 mt-1 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 채점 */}
            <Section id="grading" n="03" title="채점 방식">
              <div className="flex flex-col gap-4">
                <p>
                  <span className="text-[#3fb950]">자동화</span> 는 작성한 Playwright 단언이
                  통과하는지로 판정합니다(러너 연결 시 실제 실행, 미연결 시 구조·관련성 정적 채점).
                </p>
                <p>
                  <span className="text-[#d29922]">메뉴얼</span> 은 작성한 케이스·리포트가
                  요구사항을 충족하는지로 채점합니다. 키가 연결되면 AI가 내용을 읽고 요구사항별
                  피드백을 주고(배지 <span className="font-mono text-[#3fb950]">AI 채점</span>),
                  아니면 요구사항 연결 기준의 구조적 채점(배지{' '}
                  <span className="font-mono text-[#8b949e]">임시 모드</span>) 으로 동작합니다.
                </p>
                <p>
                  <span className="text-[#58a6ff]">API</span> 는 요청을 실제로 보내 단언·pm.test
                  통과 개수를 즉시 보여줍니다.
                </p>
              </div>

              {/* 채점 콘솔 예시 */}
              <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]/80" />
                  </span>
                  <span className="font-mono text-[11px] text-[#8b949e]">qaground 채점</span>
                  <span className="ml-auto rounded-full border border-[#3fb950]/40 px-2 py-0.5 font-mono text-[11px] text-[#3fb950]">
                    AI 채점
                  </span>
                </div>
                <div className="px-4 py-3 font-mono text-xs leading-[1.9]">
                  {DEMO_LINES.map((l) => (
                    <div key={l.text} className={l.cls}>
                      {l.text}
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* 셀렉터 */}
            <Section id="selector" n="04" title="셀렉터 전략">
              <p>
                UI 자동화는 <span className="text-text-1 font-medium">data-testid</span> 처럼 변하지
                않는 셀렉터를 우선 사용합니다. 텍스트·클래스·DOM 구조는 디자인이 변경되면 테스트가
                깨지기 쉽습니다. 챌린지마다 안정적인 셀렉터를 제공하니 그대로 활용하면 됩니다.
              </p>
              <div className="mt-5">
                <Terminal label="login.spec.ts">{`await page.goto('/sandbox/login');
await page.getByTestId('email').fill('user@test.dev');
await page.getByTestId('password').fill('secret');
await page.getByTestId('submit').click();
await expect(page.getByTestId('error')).toBeVisible();`}</Terminal>
              </div>
            </Section>

            {/* API */}
            <Section id="api" n="05" title="응답 검증">
              <p>
                상태 코드와 JSON 필드를 단언하거나 pm.test로 더 세밀하게 봅니다. 성공 경로뿐 아니라
                4xx·5xx 실패 경로까지 단언하는 것이 견고한 API 테스트입니다.
              </p>
              <div className="mt-5">
                <Terminal label="pm.test">{`pm.test('상태 코드는 200', () => {
  pm.response.to.have.status(200);
});
pm.test('총 개수 메타데이터', () => {
  pm.expect(pm.response.json().total).to.eql(12);
});`}</Terminal>
              </div>
            </Section>

            {/* 좋은 케이스 */}
            <Section id="cases" n="06" title="좋은 테스트 케이스">
              <p>
                한 시나리오에{' '}
                <span className="text-text-1 font-medium">사전조건 · 절차 · 기대 결과</span> 를
                명확히 적고, 각 케이스가 어떤 요구사항을 검증하는지 연결합니다(추적성). 정상만이
                아니라 경계와 예외까지 도출하는 것이 핵심입니다.
              </p>
              <dl className="mt-6 flex flex-col gap-4">
                {[
                  ['정상', '규칙대로 동작하는 대표 경로'],
                  ['경계', '한도·최소·최대 같은 임계값 바로 안팎'],
                  ['예외', '빈 값·잘못된 형식·권한 없음 같은 실패 경로'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <dt className="text-primary w-12 shrink-0 text-sm font-semibold">{k}</dt>
                    <dd className="text-text-2 text-sm leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>

          {/* 마무리 */}
          <div className="border-line-2 mt-16 border-t pt-12">
            <h2 className="text-text-1 text-2xl font-bold tracking-tight">이제 직접 풀 차례</h2>
            <p className="text-text-2 mt-3 text-[15px] leading-relaxed">
              입문 난이도부터 시작해 트랙을 넓혀 가세요.
            </p>
            <Link
              href="/challenges"
              className="bg-primary rounded-button hover:bg-primary/90 mt-6 inline-flex h-11 items-center justify-center px-6 text-sm font-semibold text-white transition-colors"
            >
              챌린지 보러 가기
            </Link>
          </div>
        </main>

        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24">
            <GuideToc items={TOC} />
          </div>
        </aside>
      </div>
    </div>
  );
}
