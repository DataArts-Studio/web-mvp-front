'use client';

import { useState } from 'react';

/**
 * 실사이트형 뱅킹 대시보드 샌드박스 (테스트 대상) — 토스/카카오뱅크 스타일 라이트 테마.
 *
 * 기능: 계좌 조회(총자산·계좌 선택) → 거래내역(입금/출금 필터·검색) → 이체(폼 검증).
 * 규칙:
 * - 이체 시 받는 계좌·예금주·금액 필수, 금액은 0보다 커야 한다.
 * - 출금 금액이 잔액보다 크면 "잔액 부족"으로 거부.
 * - 1회 이체 한도는 5,000,000원.
 * - 이체 성공 시 잔액이 줄고 거래내역 맨 위에 출금 내역이 추가된다.
 */

interface Account {
  id: string;
  name: string;
  bank: string;
  number: string;
  balance: number;
}

interface Tx {
  id: number;
  date: string;
  desc: string;
  amount: number; // 입금 +, 출금 -
}

const BANKS = ['국민', '신한', '우리', '하나', '카카오뱅크', '토스뱅크'];
const LIMIT = 5_000_000;
const won = (n: number) => `${n.toLocaleString()}원`;

const SEED_ACCOUNTS: Account[] = [
  { id: 'main', name: '입출금통장', bank: 'qabank', number: '110-234-567890', balance: 1_250_000 },
  { id: 'save', name: '자유적금', bank: 'qabank', number: '110-555-112233', balance: 3_200_000 },
];

const SEED_TX: Record<string, Tx[]> = {
  main: [
    { id: 1, date: '06-27', desc: '월급 입금', amount: 2_800_000 },
    { id: 2, date: '06-26', desc: '스타벅스 강남점', amount: -6_300 },
    { id: 3, date: '06-25', desc: '쿠팡 결제', amount: -48_900 },
    { id: 4, date: '06-24', desc: '김철수님 이체', amount: -150_000 },
    { id: 5, date: '06-23', desc: '이자 입금', amount: 1_200 },
    { id: 6, date: '06-22', desc: 'GS25 편의점', amount: -8_400 },
    { id: 7, date: '06-21', desc: '넷플릭스 정기결제', amount: -13_500 },
    { id: 8, date: '06-20', desc: '중고거래 입금', amount: 35_000 },
  ],
  save: [
    { id: 101, date: '06-25', desc: '자동이체 적립', amount: 300_000 },
    { id: 102, date: '05-25', desc: '자동이체 적립', amount: 300_000 },
  ],
};

let txSeq = 1000;

export const BankSandbox = () => {
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [txMap, setTxMap] = useState<Record<string, Tx[]>>(SEED_TX);
  const [selId, setSelId] = useState('main');
  const [tab, setTab] = useState<'history' | 'transfer'>('history');
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [q, setQ] = useState('');
  const [tf, setTf] = useState({ bank: '국민', account: '', name: '', amount: '', memo: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ amount: number; balanceAfter: number } | null>(null);

  const sel = accounts.find((a) => a.id === selId) ?? accounts[0];
  const txs = txMap[selId] ?? [];
  const totalAssets = accounts.reduce((n, a) => n + a.balance, 0);

  const visibleTx = txs.filter((t) => {
    const byType = filter === 'in' ? t.amount > 0 : filter === 'out' ? t.amount < 0 : true;
    return byType && t.desc.toLowerCase().includes(q.trim().toLowerCase());
  });

  const transfer = () => {
    const e: Record<string, string> = {};
    const amount = Number(tf.amount.replace(/[^0-9]/g, ''));
    if (!tf.account.trim()) e.account = '받는 계좌번호를 입력하세요.';
    if (!tf.name.trim()) e.name = '받는 분 이름을 입력하세요.';
    if (!amount || amount <= 0) e.amount = '이체 금액을 입력하세요.';
    else if (amount > sel.balance) e.amount = '잔액이 부족합니다.';
    else if (amount > LIMIT) e.amount = '1회 이체 한도(5,000,000원)를 초과했습니다.';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setDone(null);
      return;
    }
    const balanceAfter = sel.balance - amount;
    setAccounts((as) => as.map((a) => (a.id === selId ? { ...a, balance: balanceAfter } : a)));
    setTxMap((m) => ({
      ...m,
      [selId]: [
        { id: (txSeq += 1), date: '방금', desc: `${tf.name}님께 이체`, amount: -amount },
        ...(m[selId] ?? []),
      ],
    }));
    setDone({ amount, balanceAfter });
    setTf({ bank: '국민', account: '', name: '', amount: '', memo: '' });
  };

  const field =
    'rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#3182f6] h-11 w-full px-3 text-sm outline-none';
  const cardCls = 'rounded-2xl border border-gray-200 bg-white';

  return (
    <main className="min-h-screen w-full bg-gray-100 font-sans text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <span className="text-xl font-extrabold">
            qa<span className="text-[#3182f6]">bank</span>
          </span>
          <span className="text-sm text-gray-500">홍길동님</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {/* 총 자산 */}
        <div className={`${cardCls} mb-4 p-5`}>
          <p className="text-sm text-gray-500">총 자산</p>
          <p data-testid="total-assets" className="mt-1 text-3xl font-extrabold">
            {won(totalAssets)}
          </p>
        </div>

        {/* 계좌 목록 */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              data-testid="account-card"
              type="button"
              onClick={() => {
                setSelId(a.id);
                setDone(null);
                setErrors({});
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                selId === a.id ? 'border-[#3182f6] bg-[#3182f6]/5' : 'border-gray-200 bg-white'
              }`}
            >
              <p className="text-xs text-gray-400">{a.bank}</p>
              <p data-testid="account-name" className="text-sm font-bold">
                {a.name}
              </p>
              <p data-testid="account-number" className="text-xs text-gray-400">
                {a.number}
              </p>
              <p data-testid="account-balance" className="mt-2 text-lg font-extrabold">
                {won(a.balance)}
              </p>
            </button>
          ))}
        </div>

        {/* 탭 */}
        <div className={`${cardCls} p-5`}>
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            <button
              data-testid="tab-history"
              type="button"
              onClick={() => setTab('history')}
              className={`-mb-px border-b-2 px-4 pb-2 text-sm ${
                tab === 'history'
                  ? 'border-[#3182f6] font-bold text-[#3182f6]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              거래내역
            </button>
            <button
              data-testid="tab-transfer"
              type="button"
              onClick={() => {
                setTab('transfer');
                setDone(null);
                setErrors({});
              }}
              className={`-mb-px border-b-2 px-4 pb-2 text-sm ${
                tab === 'transfer'
                  ? 'border-[#3182f6] font-bold text-[#3182f6]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              이체
            </button>
          </div>

          {tab === 'history' && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  {(
                    [
                      ['all', '전체'],
                      ['in', '입금'],
                      ['out', '출금'],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      data-testid={`tx-filter-${k}`}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`h-9 rounded-full px-3 text-sm ${
                        filter === k
                          ? 'bg-[#3182f6] text-white'
                          : 'border border-gray-300 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  data-testid="tx-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="내역 검색"
                  className={`min-w-0 flex-1 ${field}`}
                />
              </div>

              <ul className="divide-y divide-gray-100">
                {visibleTx.map((t) => (
                  <li
                    key={t.id}
                    data-testid="tx-item"
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span data-testid="tx-desc" className="block truncate text-sm">
                        {t.desc}
                      </span>
                      <span className="text-xs text-gray-400">{t.date}</span>
                    </span>
                    <span
                      data-testid="tx-amount"
                      className={`shrink-0 text-sm font-bold ${
                        t.amount > 0 ? 'text-[#3182f6]' : 'text-gray-900'
                      }`}
                    >
                      {t.amount > 0 ? '+' : '-'}
                      {won(Math.abs(t.amount))}
                    </span>
                  </li>
                ))}
                {visibleTx.length === 0 && (
                  <li data-testid="tx-empty" className="py-10 text-center text-sm text-gray-500">
                    거래내역이 없습니다.
                  </li>
                )}
              </ul>
            </div>
          )}

          {tab === 'transfer' && (
            <div>
              <div
                data-testid="transfer-from"
                className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-sm"
              >
                <span className="text-gray-500">출금 계좌</span>
                <span className="ml-2 font-medium">
                  {sel.name} · 잔액 <span data-testid="from-balance">{won(sel.balance)}</span>
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <select
                    data-testid="transfer-bank"
                    value={tf.bank}
                    onChange={(e) => setTf((f) => ({ ...f, bank: e.target.value }))}
                    className="h-11 w-32 rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none"
                  >
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    data-testid="transfer-account"
                    value={tf.account}
                    onChange={(e) => setTf((f) => ({ ...f, account: e.target.value }))}
                    placeholder="받는 계좌번호"
                    className={`flex-1 ${field}`}
                  />
                </div>
                {errors.account && (
                  <span data-testid="error-account" className="text-xs text-red-600">
                    {errors.account}
                  </span>
                )}
                <input
                  data-testid="transfer-name"
                  value={tf.name}
                  onChange={(e) => setTf((f) => ({ ...f, name: e.target.value }))}
                  placeholder="받는 분"
                  className={field}
                />
                {errors.name && (
                  <span data-testid="error-name" className="text-xs text-red-600">
                    {errors.name}
                  </span>
                )}
                <input
                  data-testid="transfer-amount"
                  inputMode="numeric"
                  value={tf.amount}
                  onChange={(e) => setTf((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="이체 금액"
                  className={field}
                />
                {errors.amount && (
                  <span data-testid="error-amount" className="text-xs text-red-600">
                    {errors.amount}
                  </span>
                )}
                <input
                  data-testid="transfer-memo"
                  value={tf.memo}
                  onChange={(e) => setTf((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="받는 분 통장 표시 (선택)"
                  className={field}
                />
                <button
                  data-testid="transfer-submit"
                  type="button"
                  onClick={transfer}
                  className="h-12 rounded-lg bg-[#3182f6] text-sm font-bold text-white transition hover:brightness-95"
                >
                  이체하기
                </button>
              </div>

              {done && (
                <div
                  data-testid="transfer-success"
                  className="mt-4 rounded-xl border border-[#3182f6]/30 bg-[#3182f6]/5 px-4 py-4 text-center"
                >
                  <p className="text-sm font-bold text-[#3182f6]">이체가 완료되었습니다.</p>
                  <p className="mt-1 text-sm text-gray-700">
                    이체 금액 <span data-testid="transferred-amount">{won(done.amount)}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    출금 후 잔액 <span data-testid="balance-after">{won(done.balanceAfter)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
