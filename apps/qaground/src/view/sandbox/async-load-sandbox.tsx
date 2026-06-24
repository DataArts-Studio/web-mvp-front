'use client';

import { useState } from 'react';

type State = 'idle' | 'loading' | 'loaded';

const ITEMS = [
  '주문 #1024 결제 완료',
  '주문 #1025 배송 중',
  '주문 #1026 환불 요청',
  '주문 #1027 배송 완료',
];

/**
 * 비동기 로딩 샌드박스 (테스트 대상).
 * - 불러오기 버튼 → 로딩 스피너 → 잠시 후 콘텐츠 목록.
 * - 의도적 지연(1.2s)으로 대기·재시도 로직을 연습한다.
 */
export const AsyncLoadSandbox = () => {
  const [state, setState] = useState<State>('idle');

  const load = () => {
    setState('loading');
    // 의도적 네트워크 지연 흉내
    window.setTimeout(() => setState('loaded'), 1200);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="mb-5 text-xl font-bold">주문 내역</h1>

        <button
          data-testid="load-btn"
          type="button"
          onClick={load}
          disabled={state === 'loading'}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:opacity-60"
        >
          불러오기
        </button>

        <div className="mt-6">
          {state === 'loading' && (
            <div data-testid="loading-spinner" role="status" className="flex items-center gap-3">
              <span className="border-line-3 border-t-primary h-5 w-5 animate-spin rounded-full border-2" />
              <span className="text-text-2 text-sm">불러오는 중...</span>
            </div>
          )}

          {state === 'loaded' && (
            <ul data-testid="loaded-content" className="flex flex-col gap-2">
              {ITEMS.map((item) => (
                <li
                  key={item}
                  className="border-line-2 bg-bg-3 text-text-1 rounded-xl border px-4 py-3 text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
};
