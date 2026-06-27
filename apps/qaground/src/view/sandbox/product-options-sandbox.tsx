'use client';

import { useState } from 'react';

/**
 * 상품 옵션 선택 샌드박스 (테스트 대상).
 *
 * 사이즈·색상을 모두 선택해야 담기에 성공한다. 하나라도 비면 에러가 나고 담기지 않으며,
 * 선택한 옵션은 요약에 반영된다.
 */

const SIZES = ['S', 'M', 'L'] as const;
const COLORS: { id: string; label: string }[] = [
  { id: 'black', label: '블랙' },
  { id: 'white', label: '화이트' },
];

const optionBtn = (active: boolean) =>
  `rounded-button h-button-md border px-4 text-sm transition-colors ${
    active ? 'border-primary text-primary' : 'border-line-3 text-text-2 hover:text-text-1'
  }`;

export const ProductOptionsSandbox = () => {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    if (!size || !color) {
      setError('사이즈와 색상을 모두 선택하세요.');
      setAdded(false);
      return;
    }
    setError('');
    setAdded(true);
  };

  const colorLabel = COLORS.find((c) => c.id === color)?.label ?? '미선택';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-xl font-bold">베이직 티셔츠</h1>
        <p className="text-text-3 mt-1 mb-6 text-xs">사이즈와 색상을 선택해 담으세요.</p>

        <p className="text-text-2 mb-2 text-sm">사이즈</p>
        <div className="mb-4 flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              data-testid={`size-${s.toLowerCase()}`}
              type="button"
              onClick={() => setSize(s)}
              className={optionBtn(size === s)}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-text-2 mb-2 text-sm">색상</p>
        <div className="mb-4 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              data-testid={`color-${c.id}`}
              type="button"
              onClick={() => setColor(c.id)}
              className={optionBtn(color === c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p data-testid="selected-summary" className="text-text-3 mb-4 text-xs">
          선택: {size || '미선택'} / {colorLabel}
        </p>

        {error && (
          <p data-testid="option-error" role="alert" className="text-system-red mb-3 text-sm">
            {error}
          </p>
        )}

        {added && (
          <p
            data-testid="added-confirm"
            className="border-primary/30 bg-primary/10 text-primary mb-3 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            장바구니에 담았습니다.
          </p>
        )}

        <button
          data-testid="add-to-cart"
          type="button"
          onClick={addToCart}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex w-full items-center justify-center px-4 text-sm font-medium text-white transition-colors"
        >
          담기
        </button>
      </div>
    </main>
  );
};
