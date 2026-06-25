'use client';

import { useState } from 'react';

const TABS = [
  { id: 'overview', label: '개요', body: '상품 개요 내용입니다.' },
  { id: 'specs', label: '사양', body: '상품 사양 내용입니다.' },
  { id: 'reviews', label: '리뷰', body: '상품 리뷰 내용입니다.' },
] as const;

/**
 * 탭 전환 샌드박스 (테스트 대상).
 * - 탭을 클릭하면 해당 콘텐츠가 보이고 활성 탭이 표시된다.
 */
export const TabsSandbox = () => {
  const [active, setActive] = useState<string>('overview');
  const current = TABS.find((t) => t.id === active);

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-6">
        <div role="tablist" className="border-line-2 mb-4 flex gap-1 border-b">
          {TABS.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                data-testid={`tab-${t.id}`}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(t.id)}
                className={[
                  '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
                  on
                    ? 'border-primary text-text-1 font-medium'
                    : 'text-text-3 hover:text-text-2 border-transparent',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div data-testid="tab-panel" role="tabpanel" className="text-text-2 text-sm">
          {current?.body}
        </div>
      </div>
    </main>
  );
};
