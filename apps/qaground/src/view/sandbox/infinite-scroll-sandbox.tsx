'use client';

import { useState } from 'react';

const PAGE = 10;
const MAX = 30;

/**
 * 무한 스크롤(더 불러오기) 샌드박스 (테스트 대상).
 * - 더 불러오면 로딩 표시 후 항목이 추가되고, 끝에 도달하면 버튼이 사라진다.
 *   비동기 대기를 적절히 처리하는 연습.
 */
export const InfiniteScrollSandbox = () => {
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);

  const loadMore = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setCount((c) => Math.min(c + PAGE, MAX));
      setLoading(false);
    }, 600);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-xl font-bold">상품 목록</h1>
        <ul data-testid="scroll-list" className="flex flex-col gap-2">
          {Array.from({ length: count }, (_, i) => (
            <li
              key={i}
              data-testid="list-item"
              className="border-line-2 bg-bg-2 rounded-xl border px-4 py-3 text-sm"
            >
              상품 {i + 1}
            </li>
          ))}
        </ul>
        {loading && (
          <p data-testid="loading" className="text-text-3 py-3 text-center text-sm">
            불러오는 중...
          </p>
        )}
        {count < MAX && !loading && (
          <button
            data-testid="load-more"
            onClick={loadMore}
            className="border-line-3 text-text-2 hover:bg-bg-2 mt-3 w-full rounded-xl border py-2 text-sm transition-colors"
          >
            더 불러오기
          </button>
        )}
        {count >= MAX && (
          <p data-testid="list-end" className="text-text-3 py-3 text-center text-sm">
            마지막입니다.
          </p>
        )}
      </div>
    </main>
  );
};
