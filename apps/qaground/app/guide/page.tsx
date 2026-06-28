import type { Metadata } from 'next';
import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

const DESCRIPTION =
  'qaground 사용 가이드. 자동화(Playwright)·수동(테스트 케이스·결함 리포트)·API(Postman) 트랙이 무엇인지, 챌린지를 어떻게 풀고 채점받는지, 셀렉터·단언·좋은 테스트 케이스 작성법까지 한 번에 정리했습니다.';

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

const TRACKS = [
  {
    tag: '자동화',
    color: 'text-[#3fb950]',
    title: 'Automation · Playwright',
    desc: '실제형 화면(연습 대상)에 Playwright UI 테스트를 작성합니다. 작성한 코드의 단언이 통과하면 합격이며, 러너가 연결되면 실제 브라우저 실행으로 채점합니다.',
  },
  {
    tag: '수동',
    color: 'text-[#d29922]',
    title: 'Manual · 테스트 설계',
    desc: '요구사항을 분석해 테스트 케이스를 설계하거나, 심어둔 결함을 찾아 리포트로 작성합니다. 요구사항 충족 여부를 채점하고 모범 답안과 비교합니다.',
  },
  {
    tag: 'API',
    color: 'text-[#58a6ff]',
    title: 'API · Postman 스타일',
    desc: '요청을 구성하고 상태 코드·JSON 단언 또는 pm.test 스크립트로 응답을 검증합니다. 브라우저 안에서 실제로 요청을 보내 즉시 채점됩니다.',
  },
];

const STEPS = [
  [
    '요구사항을 읽는다',
    '챌린지 상단의 요구사항이 곧 검증 목표입니다. 무엇을 확인해야 하는지 먼저 파악하세요.',
  ],
  ['연습 대상을 연다', '제공된 연습 대상(샌드박스)이나 API 엔드포인트의 구조·셀렉터를 살펴봅니다.'],
  ['테스트를 작성한다', '정상 경로뿐 아니라 경계·예외까지 직접 설계해 작성합니다.'],
  [
    '제출하고 채점받는다',
    '채점 결과가 요구사항별로 표시되고, 모범 답안·피드백으로 빠진 부분을 보완합니다.',
  ],
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
    <h2 className="text-text-1 text-lg font-semibold">{title}</h2>
    <div className="text-text-2 mt-3 flex flex-col gap-3 text-sm leading-relaxed">{children}</div>
  </section>
);

const Code = ({ children }: { children: string }) => (
  <pre className="border-line-2 bg-bg-1 text-text-2 overflow-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
    {children}
  </pre>
);

export default function GuidePage() {
  return (
    <div className="bg-bg-1 text-text-1 min-h-screen font-sans">
      <PlaygroundHeader containerClassName="max-w-3xl" />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        {/* 히어로 */}
        <h1 className="text-3xl font-bold tracking-tight">qaground 가이드</h1>
        <p className="text-text-2 mt-3 text-base leading-relaxed">
          qaground는 로그인 없이 실제형 화면과 API에 직접 테스트를 작성·실행·채점해 보는 QA 연습
          플랫폼입니다. 자동화·수동·API 세 트랙으로 실무 감각과 과제전형을 함께 준비하세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/challenges"
            className="bg-primary rounded-button hover:bg-primary/90 inline-flex h-11 items-center justify-center px-5 text-sm font-medium text-white transition-colors"
          >
            챌린지 시작하기
          </Link>
        </div>

        <div className="mt-10 flex flex-col gap-5">
          {/* 트랙 */}
          <Section title="세 가지 트랙">
            <p>관심사·도구에 따라 트랙을 고르세요. 한 챌린지는 하나의 트랙에 속합니다.</p>
            <div className="mt-1 flex flex-col gap-3">
              {TRACKS.map((t) => (
                <div key={t.title} className="border-line-2 bg-bg-1 rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${t.color}`}>{t.tag}</span>
                    <span className="text-text-1 text-sm font-medium">{t.title}</span>
                  </div>
                  <p className="text-text-2 mt-1.5 text-sm leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 흐름 */}
          <Section title="챌린지 푸는 흐름">
            <ol className="flex flex-col gap-3">
              {STEPS.map(([title, desc], i) => (
                <li key={title} className="flex gap-3">
                  <span className="bg-primary/15 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>
                    <span className="text-text-1 text-sm font-medium">{title}</span>
                    <p className="text-text-2 mt-0.5 text-sm leading-relaxed">{desc}</p>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          {/* 채점 방식 */}
          <Section title="어떻게 채점되나요">
            <p>
              <b className="text-text-1">자동화</b>는 작성한 Playwright 테스트의 단언이 통과하는지로
              판정합니다(러너 연결 시 실제 실행, 미연결 시 구조·관련성 정적 채점).
            </p>
            <p>
              <b className="text-text-1">수동</b>은 작성한 케이스·리포트가 요구사항을 충족하는지로
              채점하고 모범 답안을 공개합니다. 키가 연결되면 AI가 내용을 읽고 요구사항별 맞춤
              피드백을 줍니다(배지 &ldquo;AI 채점&rdquo;). 그렇지 않으면 요구사항 연결 기준의 구조적
              채점(배지 &ldquo;임시 모드&rdquo;)으로 동작합니다.
            </p>
            <p>
              <b className="text-text-1">API</b>는 요청을 실제로 보내고 단언·pm.test 결과로 통과
              개수를 즉시 보여줍니다.
            </p>
          </Section>

          {/* 셀렉터 */}
          <Section title="셀렉터 전략">
            <p>
              UI 자동화는 <b className="text-text-1">data-testid</b>처럼 변하지 않는 셀렉터를 우선
              쓰는 것이 안정적입니다. 텍스트·클래스·DOM 구조는 디자인이 바뀌면 깨지기 쉽습니다.
              챌린지마다 안정적인 셀렉터를 제공하니 그대로 활용하세요.
            </p>
            <Code>{`await page.goto('/sandbox/login');
await page.getByTestId('email').fill('user@test.dev');
await page.getByTestId('password').fill('secret');
await page.getByTestId('submit').click();
await expect(page.getByTestId('error')).toBeVisible();`}</Code>
          </Section>

          {/* API 단언 */}
          <Section title="API 응답 검증">
            <p>
              상태 코드와 JSON 필드를 단언으로 확인하거나, 포스트맨 스타일 pm.test 스크립트로 더
              세밀하게 검증할 수 있습니다. 성공 경로뿐 아니라 4xx·5xx 실패 경로까지 단언하는 것이
              견고한 API 테스트입니다.
            </p>
            <Code>{`pm.test('상태 코드는 200', () => {
  pm.response.to.have.status(200);
});
pm.test('총 개수 메타데이터', () => {
  pm.expect(pm.response.json().total).to.eql(12);
});`}</Code>
          </Section>

          {/* 좋은 테스트 케이스 */}
          <Section title="좋은 테스트 케이스란">
            <p>
              하나의 시나리오에 <b className="text-text-1">사전조건 · 절차 · 기대 결과</b>를 명확히
              적고, 각 케이스가 어떤 요구사항을 검증하는지 연결합니다(추적성). 정상 경로만이 아니라
              경계값과 예외 상황까지 빠짐없이 도출하는 것이 핵심입니다.
            </p>
            <ul className="ml-4 list-disc">
              <li>정상: 규칙대로 동작하는 대표 경로</li>
              <li>경계: 한도·최소·최대 등 임계값 바로 안팎</li>
              <li>예외: 빈 값·잘못된 형식·권한 없음 등 실패 경로</li>
            </ul>
          </Section>

          {/* CTA */}
          <section className="border-line-2 bg-bg-2 rounded-2xl border p-6 text-center">
            <p className="text-text-1 text-base font-semibold">이제 직접 풀어볼 차례입니다</p>
            <p className="text-text-2 mt-1 text-sm">입문 난이도부터 시작해 트랙을 넓혀 가세요.</p>
            <Link
              href="/challenges"
              className="bg-primary rounded-button hover:bg-primary/90 mt-4 inline-flex h-11 items-center justify-center px-5 text-sm font-medium text-white transition-colors"
            >
              챌린지 보러 가기
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
