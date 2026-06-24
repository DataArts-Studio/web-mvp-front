'use client';

import { useState } from 'react';

const UNIT_PRICE = 12000;
const SHIPPING = 3000;

/**
 * 주문 폼 샌드박스 (Manual 트랙 · 탐색적 테스트 대상).
 *
 * 의도적으로 결함을 심어 두었다. 탐색적 테스트로 찾는 연습용이다.
 * - 결함 1: 합계가 배송비를 더하지 않는다 (계산 오류).
 * - 결함 2: 수량에 0·음수를 넣을 수 있다 (입력 제한 누락).
 * - 결함 3: 이름을 비워도 주문이 완료된다 (필수 입력 검증 누락).
 */
export const OrderFormSandbox = () => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [ordered, setOrdered] = useState(false);

  // 결함 1: 배송비 누락
  const total = UNIT_PRICE * qty;

  const placeOrder = () => {
    // 결함 3: 이름 필수 검증 없음
    setOrdered(true);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-5 text-xl font-bold">주문</h1>

        {ordered ? (
          <p
            data-testid="order-success"
            role="status"
            className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            주문이 완료되었습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">받는 사람</span>
              <input
                data-testid="order-name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">수량</span>
              {/* 결함 2: min 제한 없음 → 0·음수 허용 */}
              <input
                data-testid="order-qty"
                type="number"
                value={qty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQty(Number(e.target.value))
                }
                className="border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
              />
            </label>

            <dl className="border-line-2 mt-1 flex flex-col gap-1.5 border-t pt-4 text-sm">
              <div className="text-text-2 flex justify-between">
                <dt>단가</dt>
                <dd>{UNIT_PRICE.toLocaleString()}원</dd>
              </div>
              <div className="text-text-2 flex justify-between">
                <dt>배송비</dt>
                <dd>{SHIPPING.toLocaleString()}원</dd>
              </div>
              <div className="text-text-1 flex justify-between font-semibold">
                <dt>합계</dt>
                <dd data-testid="order-total">{total.toLocaleString()}원</dd>
              </div>
            </dl>

            <button
              data-testid="order-submit"
              type="button"
              onClick={placeOrder}
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              주문하기
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
