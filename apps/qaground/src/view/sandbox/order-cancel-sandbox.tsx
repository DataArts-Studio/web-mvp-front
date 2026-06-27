'use client';

import { useState } from 'react';

/**
 * 주문 취소 상태머신 샌드박스 (테스트 대상 · 시나리오형).
 *
 * 규칙:
 * - 주문 상태: 결제완료 · 배송준비중 · 배송중 · 배송완료 (+ 취소됨).
 * - 결제완료·배송준비중에서만 취소 가능 → 취소 시 전액 환불, 상태=취소됨.
 * - 배송중·배송완료는 취소 불가(버튼 비활성 + 안내).
 * - 한 번 취소한 주문은 다시 취소할 수 없다.
 * - 테스트 편의를 위해 현재 상태를 버튼으로 바꿀 수 있다(취소됨은 종료 상태).
 */

type Status = 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

const STATUS_LABEL: Record<Status, string> = {
  paid: '결제완료',
  preparing: '배송준비중',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
};

const SETTABLE: { key: Status; testid: string }[] = [
  { key: 'paid', testid: 'set-paid' },
  { key: 'preparing', testid: 'set-preparing' },
  { key: 'shipping', testid: 'set-shipping' },
  { key: 'delivered', testid: 'set-delivered' },
];

const CANCELLABLE: Status[] = ['paid', 'preparing'];
const ORDER_AMOUNT = 50000;

export const OrderCancelSandbox = () => {
  const [status, setStatus] = useState<Status>('paid');
  const [refund, setRefund] = useState<number | null>(null);

  const canCancel = CANCELLABLE.includes(status);

  const cancel = () => {
    if (!canCancel) return;
    setStatus('cancelled');
    setRefund(ORDER_AMOUNT);
  };

  const notice =
    status === 'shipping'
      ? '이미 출고되어 취소할 수 없습니다.'
      : status === 'delivered'
        ? '배송 완료 건은 취소할 수 없습니다. 반품을 이용하세요.'
        : '';

  const setBtn = (active: boolean) =>
    `rounded-button h-button-md border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? 'border-primary text-primary' : 'border-line-3 text-text-2 hover:text-text-1'
    }`;

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-xl font-bold">주문 #1024</h1>
        <p className="text-text-3 mt-1 mb-6 text-xs">결제금액 {ORDER_AMOUNT.toLocaleString()}원</p>

        <p className="text-text-3 mb-2 text-xs">상태 설정 (테스트용)</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {SETTABLE.map((s) => (
            <button
              key={s.key}
              data-testid={s.testid}
              type="button"
              disabled={status === 'cancelled'}
              onClick={() => {
                setStatus(s.key);
                setRefund(null);
              }}
              className={setBtn(status === s.key)}
            >
              {STATUS_LABEL[s.key]}
            </button>
          ))}
        </div>

        <div className="border-line-2 bg-bg-3 mb-4 flex justify-between rounded-xl border px-4 py-3 text-sm">
          <span className="text-text-3">현재 상태</span>
          <span data-testid="order-status" className="font-medium">
            {STATUS_LABEL[status]}
          </span>
        </div>

        {notice && (
          <p data-testid="cancel-notice" role="alert" className="text-system-red mb-3 text-sm">
            {notice}
          </p>
        )}

        <button
          data-testid="cancel-button"
          type="button"
          onClick={cancel}
          disabled={!canCancel}
          className="border-line-3 text-text-1 rounded-button h-button-md hover:border-system-red hover:text-system-red w-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          주문 취소
        </button>

        {status === 'cancelled' && (
          <div
            data-testid="cancel-result"
            className="border-primary/30 bg-primary/10 text-primary mt-4 flex flex-col gap-1 rounded-xl border px-4 py-4 text-center"
          >
            <p className="text-sm font-semibold">취소·환불이 완료되었습니다.</p>
            <p data-testid="refund-amount" className="font-mono text-xs">
              환불액 {refund?.toLocaleString()}원
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
