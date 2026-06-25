'use client';

import { useState } from 'react';

const ACCOUNT_RE = /^\d{3}-\d{2}-\d{6}$/;
const BALANCE = 1_000_000;
const FEE = 500;
const ONCE_LIMIT = 1_000_000;

const won = (n: number) => `${n.toLocaleString()}원`;

/**
 * 핀테크 계좌 송금 샌드박스 (테스트 대상).
 * - 계좌 형식, 금액(1회 한도·잔액+수수료 초과) 검증 후 확인 단계를 거쳐 송금한다.
 *   도메인 규칙 검증 + 2단계 확인 흐름을 다루는 연습.
 */
export const MoneyTransferSandbox = () => {
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [errors, setErrors] = useState<{ account?: string; amount?: string }>({});

  const amountNum = Number(amount);
  const total = amountNum + FEE;

  const toConfirm = () => {
    const next: typeof errors = {};
    if (!ACCOUNT_RE.test(account)) next.account = '계좌번호는 000-00-000000 형식이어야 합니다.';
    if (!amount || amountNum <= 0) next.amount = '송금 금액을 입력하세요.';
    else if (amountNum > ONCE_LIMIT)
      next.amount = `1회 송금 한도(${won(ONCE_LIMIT)})를 초과했습니다.`;
    else if (total > BALANCE) next.amount = '잔액이 부족합니다 (수수료 포함).';
    setErrors(next);
    if (Object.keys(next).length === 0) setStep('confirm');
  };

  const input =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm outline-none';
  const btn =
    'bg-primary rounded-button h-button-md inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors';
  const ghost =
    'border-line-3 text-text-2 hover:bg-bg-3 rounded-button h-button-md inline-flex items-center justify-center border px-4 text-sm';
  const row = 'flex items-center justify-between text-sm';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold">계좌 송금</h1>
          <span data-testid="balance" className="text-text-3 text-xs">
            잔액 {won(BALANCE)}
          </span>
        </div>

        {step === 'form' && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">받는 계좌</span>
              <input
                data-testid="account"
                value={account}
                placeholder="000-00-000000"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccount(e.target.value)}
                className={input}
              />
              {errors.account && (
                <span data-testid="account-error" role="alert" className="text-system-red text-xs">
                  {errors.account}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">금액</span>
              <input
                data-testid="amount"
                value={amount}
                placeholder="0"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className={input}
              />
              {errors.amount && (
                <span data-testid="amount-error" role="alert" className="text-system-red text-xs">
                  {errors.amount}
                </span>
              )}
            </label>
            <p data-testid="fee" className="text-text-3 text-xs">
              수수료 {won(FEE)}
            </p>
            <button data-testid="transfer-btn" className={btn} onClick={toConfirm}>
              송금하기
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="border-line-2 bg-bg-3 flex flex-col gap-2 rounded-xl border px-4 py-3">
              <div className={row}>
                <span className="text-text-2">받는 계좌</span>
                <span data-testid="confirm-account">{account}</span>
              </div>
              <div className={row}>
                <span className="text-text-2">금액</span>
                <span data-testid="confirm-amount">{won(amountNum)}</span>
              </div>
              <div className={row}>
                <span className="text-text-2">수수료</span>
                <span data-testid="confirm-fee">{won(FEE)}</span>
              </div>
              <div className={`${row} font-semibold`}>
                <span>출금 합계</span>
                <span data-testid="confirm-total">{won(total)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button data-testid="back-btn" className={ghost} onClick={() => setStep('form')}>
                이전
              </button>
              <button
                data-testid="confirm-btn"
                className={`${btn} flex-1`}
                onClick={() => setStep('done')}
              >
                확인 송금
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <p
            data-testid="transfer-success"
            role="status"
            className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            {won(amountNum)} 송금이 완료되었습니다.
          </p>
        )}
      </div>
    </main>
  );
};
