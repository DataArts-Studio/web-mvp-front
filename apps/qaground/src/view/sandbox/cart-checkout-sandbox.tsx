'use client';

import { useState } from 'react';

const PRODUCTS = [
  { id: 'mouse', name: '무선 마우스', price: 20000, stock: 5 },
  { id: 'keyboard', name: '기계식 키보드', price: 80000, stock: 3 },
];
const SHIPPING = 3000;
const FREE_SHIP = 50000;
const COUPON = { code: 'SAVE10', rate: 0.1, min: 20000 };

const won = (n: number) => `${n.toLocaleString()}원`;

/**
 * 커머스 장바구니 체크아웃 샌드박스 (테스트 대상).
 * - 수량 변경(재고 한도) → 소계·배송비(5만 이상 무료)·쿠폰 할인이 연쇄로 합계에 반영된다.
 *   여러 상태가 얽힌 도메인 규칙을 검증하는 연습.
 */
export const CartCheckoutSandbox = () => {
  const [qty, setQty] = useState<Record<string, number>>({ mouse: 1, keyboard: 0 });
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = PRODUCTS.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : SHIPPING;
  const discount = applied ? Math.round(subtotal * COUPON.rate) : 0;
  const total = subtotal + shipping - discount;

  const change = (id: string, delta: number) => {
    const p = PRODUCTS.find((x) => x.id === id)!;
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(p.stock, (q[id] ?? 0) + delta)) }));
    setApplied(false);
    setCouponError('');
  };

  const applyCoupon = () => {
    if (coupon !== COUPON.code) {
      setCouponError('유효하지 않은 쿠폰입니다.');
      setApplied(false);
      return;
    }
    if (subtotal < COUPON.min) {
      setCouponError(`최소 주문 금액 ${won(COUPON.min)} 이상이어야 합니다.`);
      setApplied(false);
      return;
    }
    setCouponError('');
    setApplied(true);
  };

  const row = 'flex items-center justify-between text-sm';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-md flex-col gap-5 rounded-2xl border p-6">
        <h1 className="text-xl font-bold">장바구니</h1>

        <div className="flex flex-col gap-4">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-text-3 text-xs">
                  {won(p.price)} · 재고 {p.stock}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid={`dec-${p.id}`}
                  onClick={() => change(p.id, -1)}
                  className="border-line-3 hover:bg-bg-3 h-7 w-7 rounded-md border text-sm"
                >
                  −
                </button>
                <span data-testid={`qty-${p.id}`} className="w-6 text-center text-sm">
                  {qty[p.id] ?? 0}
                </span>
                <button
                  data-testid={`inc-${p.id}`}
                  onClick={() => change(p.id, 1)}
                  className="border-line-3 hover:bg-bg-3 h-7 w-7 rounded-md border text-sm"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            data-testid="coupon-input"
            value={coupon}
            placeholder="쿠폰 코드"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoupon(e.target.value)}
            className="border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md flex-1 border px-3 text-sm outline-none"
          />
          <button
            data-testid="apply-coupon"
            onClick={applyCoupon}
            className="border-line-3 text-text-2 hover:bg-bg-3 rounded-button h-button-md border px-4 text-sm"
          >
            적용
          </button>
        </div>
        {couponError && (
          <span data-testid="coupon-error" role="alert" className="text-system-red -mt-3 text-xs">
            {couponError}
          </span>
        )}

        <div className="border-line-2 flex flex-col gap-2 border-t pt-4">
          <div className={row}>
            <span className="text-text-2">소계</span>
            <span data-testid="subtotal">{won(subtotal)}</span>
          </div>
          <div className={row}>
            <span className="text-text-2">배송비</span>
            <span data-testid="shipping">{shipping === 0 ? '무료' : won(shipping)}</span>
          </div>
          {applied && (
            <div className={row}>
              <span className="text-text-2">쿠폰 할인</span>
              <span data-testid="discount" className="text-primary">
                -{won(discount)}
              </span>
            </div>
          )}
          <div className={`${row} font-semibold`}>
            <span>합계</span>
            <span data-testid="total">{won(total)}</span>
          </div>
        </div>

        <button
          data-testid="checkout-btn"
          disabled={subtotal === 0}
          className="bg-primary rounded-button h-button-md inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          결제하기
        </button>
      </div>
    </main>
  );
};
