'use client';

import { useState } from 'react';

/**
 * 위시리스트 토글 샌드박스 (테스트 대상).
 *
 * 상품별 찜 버튼을 토글하면 위시 상태(aria-pressed)와 개수 배지가 갱신된다.
 */

const PRODUCTS: { id: string; name: string }[] = [
  { id: '1', name: '무선 마우스' },
  { id: '2', name: '기계식 키보드' },
  { id: '3', name: '4K 모니터' },
];

export const WishlistSandbox = () => {
  const [wished, setWished] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setWished((w) => ({ ...w, [id]: !w[id] }));
  const count = Object.values(wished).filter(Boolean).length;

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">상품 목록</h1>
          <span
            data-testid="wish-count"
            className="border-line-3 text-text-2 rounded-full border px-2.5 py-0.5 text-xs"
          >
            찜 {count}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {PRODUCTS.map((p) => {
            const on = !!wished[p.id];
            return (
              <li
                key={p.id}
                className="border-line-3 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <span className="text-sm">{p.name}</span>
                <button
                  data-testid={`wish-${p.id}`}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${p.name} 찜`}
                  onClick={() => toggle(p.id)}
                  className={`rounded-button h-button-md border px-3 text-sm transition-colors ${
                    on
                      ? 'border-primary text-primary'
                      : 'border-line-3 text-text-3 hover:text-text-1'
                  }`}
                >
                  {on ? '♥ 찜함' : '♡ 찜'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
};
