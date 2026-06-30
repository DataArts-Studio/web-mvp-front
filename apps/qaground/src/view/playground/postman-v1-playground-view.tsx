import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

const REQUEST_LINES = [
  'POST /api/practice/auth/login',
  'Content-Type: application/json',
  '',
  '{',
  '  "email": "tester@qaground.dev",',
  '  "password": "qaground123"',
  '}',
];

const SCRIPT_LINES = [
  "pm.test('로그인 성공 상태 코드', () => {",
  '  pm.response.to.have.status(200);',
  '});',
  '',
  "pm.test('토큰과 사용자 이메일을 반환한다', () => {",
  '  const json = pm.response.json();',
  "  pm.expect(json.token).to.eql('qaground-demo-token');",
  "  pm.expect(json.user.email).to.eql('tester@qaground.dev');",
  '});',
];

const STEPS = [
  ['요청 구성', '메서드, 엔드포인트, 헤더, JSON 본문을 Postman처럼 한 번에 정리합니다.'],
  ['응답 확인', '상태 코드와 JSON 필드를 분리해 실제 실패 지점을 찾을 수 있게 봅니다.'],
  ['검증 스크립트 작성', 'pm.test와 pm.expect 문법으로 채점 가능한 단언을 만듭니다.'],
];

export const PostmanV1PlaygroundView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-6xl" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <Link
          href="/playground"
          className="text-text-3 hover:text-text-1 text-sm transition-colors"
        >
          ← 플레이그라운드 목록
        </Link>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/12 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                Postman
              </span>
              <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-0.5 text-xs">v1</span>
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Postman 형식 v1</h1>
            <p className="text-text-2 mt-4 max-w-2xl text-sm leading-relaxed">
              API 테스트를 요청 구성, 응답 관찰, 검증 스크립트 작성 순서로 연습합니다. 이후 API
              챌린지에서 같은 형식의 요청과 pm.test 단언을 제출하게 됩니다.
            </p>
          </div>

          <div className="border-line-2 bg-bg-2 rounded-2xl border p-5">
            <h2 className="text-sm font-semibold">v1 범위</h2>
            <ul className="text-text-2 mt-3 space-y-2 text-sm">
              <li>상태 코드 검증</li>
              <li>JSON 응답 필드 검증</li>
              <li>Bearer 인증 흐름 준비</li>
              <li>pm.test / pm.expect 기본 문법</li>
            </ul>
          </div>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map(([title, desc], index) => (
            <article key={title} className="border-line-2 bg-bg-2 rounded-2xl border p-5">
              <span className="text-primary text-xs font-semibold">0{index + 1}</span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="text-text-2 mt-2 text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-2xl border">
            <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">요청 예시</h2>
              <span className="text-text-3 font-mono text-xs">request</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
              <code>{REQUEST_LINES.join('\n')}</code>
            </pre>
          </article>

          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-2xl border">
            <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">검증 스크립트</h2>
              <span className="text-text-3 font-mono text-xs">pm.test</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
              <code>{SCRIPT_LINES.join('\n')}</code>
            </pre>
          </article>
        </section>

        <section className="border-line-2 bg-bg-2 mt-10 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">다음 단계</h2>
          <p className="text-text-2 mt-2 text-sm leading-relaxed">
            형식이 익숙해지면 API 챌린지에서 실제 엔드포인트를 호출하고, 성공·실패 경로를 모두
            검증하는 제출 코드를 작성합니다.
          </p>
          <Link
            href="/challenges?category=api"
            className="bg-primary rounded-button hover:bg-primary/90 mt-5 inline-flex h-10 items-center justify-center px-5 text-sm font-semibold text-white transition-colors"
          >
            API 챌린지로 이동
          </Link>
        </section>
      </main>
    </div>
  );
};
