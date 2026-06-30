import Link from 'next/link';

import type { ApiEndpoint } from '@/shared/challenges/registry';
import { ApiTesterExercise } from '@/view/challenges/api-tester-exercise';
import { PlaygroundHeader } from '@/view/challenges/playground-header';

const API_BASE = '/api/practice';

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/auth/login',
    desc: '로그인 → 토큰 (성공 200 / 무효 401)',
    body: [
      { path: 'email', type: 'string', required: true, desc: '데모 계정 이메일' },
      { path: 'password', type: 'string', required: true, desc: '데모 계정 비밀번호' },
    ],
    response: [
      { path: 'token', type: 'string', required: true },
      { path: 'user.email', type: 'string', required: true },
    ],
    responseExample: { token: 'qaground-demo-token', user: { email: 'tester@qaground.dev' } },
  },
  {
    method: 'GET',
    path: '/auth/me',
    auth: true,
    desc: 'Bearer 토큰으로 현재 사용자 조회 (200 / 401)',
    response: [
      { path: 'id', type: 'number', required: true },
      { path: 'email', type: 'string', required: true },
      { path: 'role', type: 'string', required: true },
    ],
    responseExample: { id: 1, email: 'tester@qaground.dev', role: 'member' },
  },
  {
    method: 'GET',
    path: '/products?page=1&limit=5',
    desc: '상품 목록 조회 (200)',
    query: [
      { path: 'page', type: 'number', desc: '페이지 번호' },
      { path: 'limit', type: 'number', desc: '페이지 크기' },
      { path: 'category', type: 'string', desc: '카테고리 필터' },
    ],
    response: [
      { path: 'items', type: 'array', required: true },
      { path: 'total', type: 'number', required: true },
      { path: 'page', type: 'number', required: true },
      { path: 'limit', type: 'number', required: true },
    ],
    responseExample: {
      items: [{ id: 1, name: '무선 키보드', category: '주변기기', price: 39000 }],
      total: 12,
      page: 1,
      limit: 5,
    },
  },
  {
    method: 'POST',
    path: '/products',
    auth: true,
    desc: '상품 생성 (성공 201 / 검증 실패 400 / 인증 실패 401)',
    body: [
      { path: 'name', type: 'string', required: true },
      { path: 'price', type: 'number', required: true },
      { path: 'category', type: 'string' },
    ],
    response: [
      { path: 'id', type: 'number', required: true },
      { path: 'name', type: 'string', required: true },
      { path: 'price', type: 'number', required: true },
    ],
    responseExample: { id: 13, name: '테스트 상품', price: 12000, category: '기타' },
  },
  {
    method: 'GET',
    path: '/status/200',
    desc: 'HTTP 상태 코드 시뮬레이터 (200)',
    response: [{ path: 'status', type: 'number', required: true }],
    responseExample: { status: 200, message: 'OK' },
  },
];

const GUIDE_ITEMS = [
  '요청 케이스를 선택하고 실행해 응답 구조를 확인합니다.',
  '토큰이 필요한 API는 로그인 응답의 token을 Bearer 값으로 넣습니다.',
  '검증 조건 또는 스크립트 작성 탭에서 원하는 단언을 추가합니다.',
  '정답 제출 없이 실패 케이스와 헤더 조합을 자유롭게 바꿔봅니다.',
];

export const PostmanV1PlaygroundView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-[1440px]" />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-6 lg:px-6">
        <div className="border-line-2 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-3">
          <Link
            href="/playground"
            className="text-text-3 hover:text-text-1 text-sm transition-colors"
          >
            ← 목록
          </Link>
          <span className="bg-primary/12 text-primary rounded px-2 py-0.5 text-xs font-medium">
            API Sandbox
          </span>
          <span className="bg-bg-3 text-text-2 rounded px-2 py-0.5 text-xs">v1 engine</span>
          <h1 className="text-lg font-semibold tracking-tight">Postman 형식 API Sandbox v1</h1>
          <p className="text-text-3 min-w-0 flex-1 truncate text-sm">
            제공된 API를 선택해 요청을 보내고 pm.test 스크립트를 작성합니다.
          </p>
        </div>

        <div className="grid min-h-[760px] flex-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-line-2 bg-bg-2 rounded-lg border lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
            <section className="border-line-2 border-b p-4">
              <h2 className="text-sm font-semibold">제공 환경</h2>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <dt className="text-text-3">Base URL</dt>
                  <dd className="text-text-2 font-mono">{API_BASE}</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <dt className="text-text-3">Email</dt>
                  <dd className="text-text-2 font-mono">tester@qaground.dev</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <dt className="text-text-3">Password</dt>
                  <dd className="text-text-2 font-mono">qaground123</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <dt className="text-text-3">Token</dt>
                  <dd className="text-text-2 font-mono">qaground-demo-token</dd>
                </div>
              </dl>
            </section>

            <section className="border-line-2 border-b p-4">
              <h2 className="text-sm font-semibold">엔드포인트</h2>
              <div className="mt-3 space-y-2">
                {ENDPOINTS.map((endpoint) => (
                  <div key={`${endpoint.method} ${endpoint.path}`} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-primary w-10 font-mono font-semibold">
                        {endpoint.method}
                      </span>
                      <code className="text-text-1 min-w-0 truncate">{endpoint.path}</code>
                    </div>
                    <p className="text-text-3 mt-1 pl-12">{endpoint.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4">
              <h2 className="text-sm font-semibold">자유 실험 가이드</h2>
              <ol className="text-text-2 mt-3 space-y-2 text-xs leading-relaxed">
                {GUIDE_ITEMS.map((item, index) => (
                  <li key={item} className="grid grid-cols-[1.25rem_1fr] gap-2">
                    <span className="text-text-3">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>

          <div className="border-line-2 min-h-[760px] overflow-hidden rounded-lg border">
            <ApiTesterExercise
              apiBase={API_BASE}
              slug="playground-postman-v1"
              endpoints={ENDPOINTS}
              mode="playground"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
