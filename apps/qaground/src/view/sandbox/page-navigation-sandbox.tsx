'use client';

import { useState } from 'react';

/**
 * 페이지 전환 샌드박스 (테스트 대상).
 *
 * 내부 상태 기반 미니 라우터. 내비 클릭으로 페이지가 전환되고 방문 이력을 쌓아,
 * 뒤로가기로 직전 페이지로 돌아간다. 첫 페이지에서는 뒤로가기가 비활성이다.
 */

type PageKey = 'dashboard' | 'orders' | 'settings';

const PAGES: Record<PageKey, { title: string; body: string }> = {
  dashboard: { title: '대시보드', body: '오늘의 요약 지표를 봅니다.' },
  orders: { title: '주문', body: '주문 목록과 상태를 관리합니다.' },
  settings: { title: '설정', body: '계정과 알림을 설정합니다.' },
};

const PAGE_KEYS = Object.keys(PAGES) as PageKey[];

export const PageNavigationSandbox = () => {
  const [history, setHistory] = useState<PageKey[]>(['dashboard']);
  const current = history[history.length - 1];

  const navigate = (key: PageKey) => {
    if (key === current) return;
    setHistory((h) => [...h, key]);
  };
  const goBack = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  const page = PAGES[current];

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <nav className="mb-6 flex gap-2" aria-label="주요 메뉴">
          {PAGE_KEYS.map((key) => (
            <button
              key={key}
              data-testid={`nav-${key}`}
              type="button"
              onClick={() => navigate(key)}
              aria-current={key === current ? 'page' : undefined}
              className={`rounded-button h-button-md border px-3 text-sm transition-colors ${
                key === current
                  ? 'border-primary text-primary'
                  : 'border-line-3 text-text-2 hover:text-text-1'
              }`}
            >
              {PAGES[key].title}
            </button>
          ))}
        </nav>

        <p className="text-text-3 mb-2 text-xs" data-testid="breadcrumb">
          {history.map((k) => PAGES[k].title).join(' › ')}
        </p>

        <h1 className="text-xl font-bold" data-testid="page-title">
          {page.title}
        </h1>
        <p className="text-text-2 mt-2 text-sm" data-testid="page-body">
          {page.body}
        </p>

        <button
          data-testid="back-button"
          type="button"
          onClick={goBack}
          disabled={history.length <= 1}
          className="border-line-3 text-text-2 rounded-button h-button-md hover:text-text-1 mt-6 border px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          뒤로
        </button>
      </div>
    </main>
  );
};
