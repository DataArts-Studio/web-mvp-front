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
  ['요청 바꿔보기', '메서드, 헤더, 본문을 바꾸며 응답 차이를 확인합니다.'],
  ['검증 스크립트 실험', 'pm.test 예시를 출발점으로 원하는 단언을 추가합니다.'],
  ['실패 케이스 관찰', '잘못된 토큰, 누락된 본문, 4xx/5xx 상태를 직접 만듭니다.'],
];

export const PostmanV1PlaygroundView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-[1440px]" />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-8">
        <Link
          href="/playground"
          className="text-text-3 hover:text-text-1 text-sm transition-colors"
        >
          ← 플레이그라운드 목록
        </Link>

        <header className="border-line-2 mt-6 grid gap-6 border-b pb-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/12 text-primary rounded px-2 py-0.5 text-xs font-medium">
                API Sandbox
              </span>
              <span className="bg-bg-3 text-text-2 rounded px-2 py-0.5 text-xs">v1</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Postman 형식 API Sandbox v1</h1>
            <p className="text-text-2 mt-3 max-w-4xl text-sm leading-relaxed">
              qaground가 제공하는 데모 API를 Postman 스타일로 자유롭게 호출해보는 공간입니다.
              채점이나 제출 없이 요청을 바꾸고, 응답을 관찰하고, 필요한 검증 스크립트를 직접
              실험합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="border-line-2 rounded-lg border p-3">
              <p className="text-text-3 text-xs">데모 계정</p>
              <p className="mt-1 font-mono text-xs">tester@qaground.dev</p>
            </div>
            <div className="border-line-2 rounded-lg border p-3">
              <p className="text-text-3 text-xs">비밀번호</p>
              <p className="mt-1 font-mono text-xs">qaground123</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {FREE_PLAY_ITEMS.map(([title, desc], index) => (
            <article key={title} className="border-line-2 rounded-lg border p-4">
              <span className="text-primary text-xs font-semibold">0{index + 1}</span>
              <h2 className="mt-2 text-sm font-semibold">{title}</h2>
              <p className="text-text-2 mt-1 text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[420px_1fr_1fr]">
          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-lg border">
            <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">제공 API</h2>
              <span className="text-text-3 font-mono text-xs">endpoints</span>
            </div>
            <div className="divide-line-2 divide-y">
              {ENDPOINTS.map(([method, path, desc]) => (
                <div key={`${method}-${path}`} className="grid gap-2 p-4 sm:grid-cols-[64px_1fr]">
                  <span className="text-primary font-mono text-xs font-semibold">{method}</span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">{path}</p>
                    <p className="text-text-2 mt-1 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-lg border">
            <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">요청 예시</h2>
              <span className="text-text-3 font-mono text-xs">request</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code>{REQUEST_LINES.join('\n')}</code>
            </pre>
          </article>

          <article className="border-line-2 bg-bg-2 overflow-hidden rounded-lg border">
            <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">검증 스크립트 샘플</h2>
              <span className="text-text-3 font-mono text-xs">optional</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code>{SCRIPT_LINES.join('\n')}</code>
            </pre>
          </article>
        </section>
      </main>
    </div>
  );
};
