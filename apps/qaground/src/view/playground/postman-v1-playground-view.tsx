'use client';

import type {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useState } from 'react';

import Link from 'next/link';

import type { ApiEndpoint } from '@/shared/challenges/registry';
import { ApiTesterExercise } from '@/view/challenges/api-tester-exercise';
import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { ArrowLeft } from 'lucide-react';

const API_BASE = '/api/practice';
const DEFAULT_RAIL_WIDTH = 340;
const MIN_RAIL_WIDTH = 300;
const MAX_RAIL_WIDTH = 520;

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/auth/login',
    desc: '로그인 → 토큰 (성공 200 / 무효 401)',
    body: [
      {
        path: 'email',
        type: 'string',
        required: true,
        desc: '데모 계정 이메일',
        example: 'tester@qaground.dev',
      },
      {
        path: 'password',
        type: 'string',
        required: true,
        desc: '데모 계정 비밀번호',
        example: 'qaground123',
      },
    ],
    response: [{ path: 'token', type: 'string', required: true }],
    responseExample: { token: 'qaground-demo-token' },
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
      { path: 'data', type: 'array', required: true },
      { path: 'total', type: 'number', required: true },
      { path: 'page', type: 'number', required: true },
      { path: 'limit', type: 'number', required: true },
      { path: 'totalPages', type: 'number', required: true },
    ],
    responseExample: {
      data: [{ id: 1, name: '무선 키보드', category: '주변기기', price: 39000 }],
      total: 12,
      page: 1,
      limit: 5,
      totalPages: 3,
    },
  },
  {
    method: 'POST',
    path: '/products',
    auth: true,
    desc: '상품 생성 (성공 201 / 검증 실패 400 / 인증 실패 401)',
    body: [
      { path: 'name', type: 'string', required: true, example: '테스트 상품' },
      { path: 'price', type: 'number', required: true, example: 12000 },
      { path: 'category', type: 'string', example: '기타' },
    ],
    response: [
      { path: 'id', type: 'number', required: true },
      { path: 'name', type: 'string', required: true, example: '테스트 상품' },
      { path: 'price', type: 'number', required: true, example: 12000 },
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
  '실패 케이스와 헤더 조합을 자유롭게 바꿔봅니다.',
];

const METHOD_CLASS: Record<ApiEndpoint['method'], string> = {
  GET: 'text-[#58a6ff]',
  POST: 'text-[#d29922]',
  PUT: 'text-[#3fb950]',
  PATCH: 'text-[#a371f7]',
  DELETE: 'text-[#f85149]',
};

function clampRailWidth(width: number) {
  return Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, width));
}

function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-5 first:pt-0">
      <h2 className="text-text-3 text-[11px] font-semibold tracking-[0.14em] uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const PostmanV1PlaygroundView = () => {
  const [railWidth, setRailWidth] = useState(DEFAULT_RAIL_WIDTH);

  const startRailResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = railWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setRailWidth(clampRailWidth(startWidth + moveEvent.clientX - startX));
    };

    const stopResize = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
  };

  const handleRailResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    setRailWidth((width) => clampRailWidth(width + (event.key === 'ArrowRight' ? 20 : -20)));
  };

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-none" />
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <header className="border-line-2 flex items-start justify-between gap-4 border-b px-4 py-2">
          <div className="flex min-w-0 items-start gap-2">
            <Link
              href="/playground"
              aria-label="플레이그라운드 목록으로 이동"
              className="border-line-2 text-text-3 hover:text-text-1 hover:bg-bg-2 flex size-7 shrink-0 items-center justify-center border transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight">Postman v1 플레이그라운드</h1>
              <p className="text-text-3 mt-0.5 truncate text-sm">
                제공된 API를 선택해 요청을 보내고 pm.test 스크립트를 작성합니다.
              </p>
            </div>
          </div>
          <div className="text-text-3 flex shrink-0 items-center gap-2 pt-0.5 text-sm">
            <Link href="/playground" className="hover:text-text-1 transition-colors">
              플레이그라운드
            </Link>
            <span>/</span>
            <span className="text-text-2">Postman v1</span>
          </div>
        </header>

        <div
          className="grid min-h-0 flex-1 lg:grid-cols-[var(--playground-rail-width)_6px_minmax(0,1fr)]"
          style={{ '--playground-rail-width': `${railWidth}px` } as CSSProperties}
        >
          <aside className="border-line-2 qg-panel-scrollbar overflow-auto px-4 py-4 text-sm lg:border-r">
            <RailSection title="Environment">
              <dl className="space-y-2 text-xs">
                {[
                  ['Base URL', API_BASE],
                  ['Email', 'tester@qaground.dev'],
                  ['Password', 'qaground123'],
                  ['Token', 'qaground-demo-token'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[4.75rem_1fr] gap-2">
                    <dt className="text-text-3">{label}</dt>
                    <dd className="text-text-2 min-w-0 truncate font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            </RailSection>

            <RailSection title="Endpoints">
              <div className="divide-line-2 divide-y">
                {ENDPOINTS.map((endpoint) => (
                  <div key={`${endpoint.method} ${endpoint.path}`} className="py-2.5 first:pt-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`w-11 shrink-0 font-mono text-[11px] font-semibold ${METHOD_CLASS[endpoint.method]}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-text-1 min-w-0 truncate text-xs">{endpoint.path}</code>
                    </div>
                    <p className="text-text-3 mt-1 line-clamp-2 pl-[3.25rem] text-xs leading-relaxed">
                      {endpoint.desc}
                    </p>
                  </div>
                ))}
              </div>
            </RailSection>

            <RailSection title="Flow">
              <ol className="text-text-2 space-y-2 text-xs leading-relaxed">
                {GUIDE_ITEMS.map((item, index) => (
                  <li key={item} className="grid grid-cols-[1.25rem_1fr] gap-2">
                    <span className="text-text-3 font-mono">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </RailSection>
          </aside>

          <div
            aria-label="좌측 패널 너비 조절"
            aria-orientation="vertical"
            className="group border-line-2 hidden cursor-col-resize border-r lg:block"
            onKeyDown={handleRailResizeKeyDown}
            onPointerDown={startRailResize}
            role="separator"
            tabIndex={0}
          >
            <div className="group-hover:bg-primary/25 h-full w-full transition-colors" />
          </div>

          <div className="min-h-0 overflow-hidden">
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
