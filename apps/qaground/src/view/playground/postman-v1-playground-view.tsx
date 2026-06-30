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

const ENDPOINTS = [
  ['POST', '/api/practice/auth/login', '데모 계정으로 토큰을 발급받습니다.'],
  ['GET', '/api/practice/auth/me', 'Bearer 토큰으로 현재 사용자를 조회합니다.'],
  ['GET', '/api/practice/products', '상품 목록, 검색, 필터 응답을 확인합니다.'],
  ['GET', '/api/practice/status/[code]', '원하는 HTTP 상태 코드를 직접 관찰합니다.'],
];

const FREE_PLAY_ITEMS = [
  ['요청 바꿔보기', '메서드, 헤더, 본문을 바꾸며 응답이 어떻게 달라지는지 확인합니다.'],
  ['검증 스크립트 실험', 'pm.test 예시는 출발점일 뿐이며 원하는 단언을 자유롭게 추가합니다.'],
  ['실패 케이스 관찰', '잘못된 토큰, 누락된 본문, 4xx/5xx 상태를 직접 만들어 봅니다.'],
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
                API Sandbox
              </span>
              <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-0.5 text-xs">v1</span>
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Postman 형식 API Sandbox v1
            </h1>
            <p className="text-text-2 mt-4 max-w-2xl text-sm leading-relaxed">
              qaground가 제공하는 데모 API를 Postman 스타일로 자유롭게 호출해보는 공간입니다.
              채점이나 제출 없이 요청을 바꾸고, 응답을 관찰하고, 필요한 검증 스크립트를 직접
              실험합니다.
            </p>
          </div>

          <div className="border-line-2 bg-bg-2 rounded-2xl border p-5">
            <h2 className="text-sm font-semibold">제공 리소스</h2>
            <ul className="text-text-2 mt-3 space-y-2 text-sm">
              <li>데모 인증 계정: tester@qaground.dev / qaground123</li>
              <li>로그인, 사용자, 상품, 상태 코드 API</li>
              <li>Bearer 토큰과 JSON 응답 예시</li>
              <li>pm.test 스타일 검증 스크립트 샘플</li>
            </ul>
          </div>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {FREE_PLAY_ITEMS.map(([title, desc], index) => (
            <article key={title} className="border-line-2 bg-bg-2 rounded-2xl border p-5">
              <span className="text-primary text-xs font-semibold">0{index + 1}</span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="text-text-2 mt-2 text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-2xl border">
            <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">제공 API</h2>
              <span className="text-text-3 font-mono text-xs">endpoints</span>
            </div>
            <div className="divide-line-2 divide-y">
              {ENDPOINTS.map(([method, path, desc]) => (
                <div key={`${method}-${path}`} className="grid gap-2 p-5 sm:grid-cols-[72px_1fr]">
                  <span className="text-primary font-mono text-xs font-semibold">{method}</span>
                  <div>
                    <p className="font-mono text-sm">{path}</p>
                    <p className="text-text-2 mt-1 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-2xl border">
            <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">요청 예시</h2>
              <span className="text-text-3 font-mono text-xs">request</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
              <code>{REQUEST_LINES.join('\n')}</code>
            </pre>
          </article>
        </section>

        <section className="border-line-2 bg-bg-2 mt-6 overflow-hidden rounded-2xl border">
          <div className="border-line-2 flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">검증 스크립트 샘플</h2>
            <span className="text-text-3 font-mono text-xs">optional</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
            <code>{SCRIPT_LINES.join('\n')}</code>
          </pre>
        </section>
      </main>
    </div>
  );
};
