'use client';

import { useState } from 'react';

/**
 * 주문 결제 E2E 샌드박스 (테스트 대상).
 *
 * 상품 선택 → 장바구니 → 배송 정보 → 결제수단 → 주문 완료의 다단계 여정.
 * 빈 장바구니로는 장바구니 단계로 넘어갈 수 없고, 배송 정보가 비면 결제로 넘어갈 수 없다.
 */

type Step = 'catalog' | 'cart' | 'shipping' | 'payment' | 'done';

interface Product {
  id: string;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: 'mouse', name: '무선 마우스', price: 20000 },
  { id: 'keyboard', name: '기계식 키보드', price: 80000 },
];

const STEP_TITLE: Record<Step, string> = {
  catalog: '상품 선택',
  cart: '장바구니',
  shipping: '배송 정보',
  payment: '결제수단',
  done: '주문 완료',
};

const inputClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';
const primaryBtn =
  'bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const ghostBtn =
  'border-line-3 text-text-2 rounded-button h-button-md hover:text-text-1 border px-4 text-sm transition-colors';

export const CheckoutFlowSandbox = () => {
  const [step, setStep] = useState<Step>('catalog');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shipError, setShipError] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [orderNo, setOrderNo] = useState('');

  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  const toPayment = () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setShipError('배송 정보를 모두 입력하세요.');
      return;
    }
    setShipError('');
    setStep('payment');
  };

  const placeOrder = () => {
    if (!payMethod) return;
    setOrderNo(`ORD-2024-${1000 + cartCount}`);
    setStep('done');
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold" data-testid="step-title">
            {STEP_TITLE[step]}
          </h1>
          {(step === 'catalog' || step === 'cart') && (
            <span
              data-testid="cart-count"
              className="border-line-3 text-text-2 rounded-full border px-2.5 py-0.5 text-xs"
            >
              장바구니 {cartCount}
            </span>
          )}
        </div>

        {step === 'catalog' && (
          <div className="flex flex-col gap-3">
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className="border-line-3 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-text-3 text-xs">{p.price.toLocaleString()}원</p>
                </div>
                <button
                  data-testid={`add-${p.id}`}
                  type="button"
                  onClick={() => add(p.id)}
                  className={ghostBtn}
                >
                  담기
                </button>
              </div>
            ))}
            <button
              data-testid="go-cart"
              type="button"
              onClick={() => setStep('cart')}
              disabled={cartCount === 0}
              className={`${primaryBtn} mt-2`}
            >
              장바구니로
            </button>
          </div>
        )}

        {step === 'cart' && (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2" data-testid="cart-items">
              {PRODUCTS.filter((p) => cart[p.id]).map((p) => (
                <li
                  key={p.id}
                  data-testid={`cart-line-${p.id}`}
                  className="border-line-3 flex justify-between rounded-xl border px-4 py-3 text-sm"
                >
                  <span>{p.name}</span>
                  <span className="text-text-3">x {cart[p.id]}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <button
                data-testid="back-catalog"
                type="button"
                onClick={() => setStep('catalog')}
                className={ghostBtn}
              >
                이전
              </button>
              <button
                data-testid="go-shipping"
                type="button"
                onClick={() => setStep('shipping')}
                className={primaryBtn}
              >
                배송 정보 입력
              </button>
            </div>
          </div>
        )}

        {step === 'shipping' && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">받는 사람</span>
              <input
                data-testid="ship-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">주소</span>
              <input
                data-testid="ship-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">연락처</span>
              <input
                data-testid="ship-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </label>
            {shipError && (
              <p data-testid="shipping-error" role="alert" className="text-system-red text-sm">
                {shipError}
              </p>
            )}
            <button
              data-testid="go-payment"
              type="button"
              onClick={toPayment}
              className={primaryBtn}
            >
              결제수단 선택
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  data-testid="pay-card"
                  type="radio"
                  name="pay"
                  checked={payMethod === 'card'}
                  onChange={() => setPayMethod('card')}
                />
                신용카드
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  data-testid="pay-bank"
                  type="radio"
                  name="pay"
                  checked={payMethod === 'bank'}
                  onChange={() => setPayMethod('bank')}
                />
                무통장 입금
              </label>
            </fieldset>
            <button
              data-testid="place-order"
              type="button"
              onClick={placeOrder}
              disabled={!payMethod}
              className={`${primaryBtn} mt-2`}
            >
              주문하기
            </button>
          </div>
        )}

        {step === 'done' && (
          <div
            data-testid="order-complete"
            className="border-primary/30 bg-primary/10 text-primary flex flex-col gap-1 rounded-xl border px-4 py-5 text-center"
          >
            <p className="text-sm font-semibold">주문이 완료되었습니다.</p>
            <p data-testid="order-number" className="font-mono text-xs">
              {orderNo}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
