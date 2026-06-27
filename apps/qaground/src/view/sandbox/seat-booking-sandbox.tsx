'use client';

import { useState } from 'react';

/**
 * 콘서트 좌석 예매 샌드박스 (테스트 대상 · 시나리오형).
 *
 * 규칙:
 * - 좌석 A1~A5, B1~B5 (10석). A3·B2 는 시작부터 매진.
 * - 매진 좌석은 선택 불가. 최대 4석까지 선택. 초과 선택 시 경고.
 * - 좌석당 50,000원. 선택 수·총액 실시간 표시.
 * - 1석 이상 선택해야 예매 가능. 예매 시 선택 좌석이 매진되고 예매번호 발급.
 */

const ROWS = ['A', 'B'] as const;
const COLS = [1, 2, 3, 4, 5] as const;
const SEATS = ROWS.flatMap((r) => COLS.map((c) => `${r}${c}`));
const INITIAL_SOLD = ['A3', 'B2'];
const PRICE = 50000;
const MAX_SEATS = 4;

export const SeatBookingSandbox = () => {
  const [sold, setSold] = useState<string[]>(INITIAL_SOLD);
  const [selected, setSelected] = useState<string[]>([]);
  const [warning, setWarning] = useState('');
  const [bookingNo, setBookingNo] = useState('');

  const toggle = (seat: string) => {
    if (sold.includes(seat)) return;
    setBookingNo('');
    if (selected.includes(seat)) {
      setSelected((s) => s.filter((x) => x !== seat));
      setWarning('');
      return;
    }
    if (selected.length >= MAX_SEATS) {
      setWarning(`최대 ${MAX_SEATS}석까지 선택할 수 있습니다.`);
      return;
    }
    setSelected((s) => [...s, seat]);
    setWarning('');
  };

  const book = () => {
    if (selected.length === 0) return;
    setSold((s) => [...s, ...selected]);
    setBookingNo(`BK-${[...selected].sort().join('-')}`);
    setSelected([]);
    setWarning('');
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="text-xl font-bold">콘서트 좌석 예매</h1>
        <p className="text-text-3 mt-1 mb-6 text-xs">좌석당 {PRICE.toLocaleString()}원</p>

        <div className="mb-4 grid grid-cols-5 gap-2">
          {SEATS.map((seat) => {
            const isSold = sold.includes(seat);
            const isSel = selected.includes(seat);
            return (
              <button
                key={seat}
                data-testid={`seat-${seat}`}
                type="button"
                disabled={isSold}
                aria-pressed={isSel}
                onClick={() => toggle(seat)}
                className={`rounded-button h-10 border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSel
                    ? 'border-primary text-primary'
                    : 'border-line-3 text-text-2 hover:text-text-1'
                }`}
              >
                {seat}
              </button>
            );
          })}
        </div>

        {warning && (
          <p data-testid="max-warning" role="alert" className="text-system-red mb-3 text-sm">
            {warning}
          </p>
        )}

        <div className="border-line-2 bg-bg-3 mb-4 flex justify-between rounded-xl border px-4 py-3 text-sm">
          <span data-testid="select-count">선택 {selected.length}석</span>
          <span data-testid="total-price">{(selected.length * PRICE).toLocaleString()}원</span>
        </div>

        <button
          data-testid="book-button"
          type="button"
          onClick={book}
          disabled={selected.length === 0}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex w-full items-center justify-center px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          예매하기
        </button>

        {bookingNo && (
          <div
            data-testid="booking-complete"
            className="border-primary/30 bg-primary/10 text-primary mt-4 flex flex-col gap-1 rounded-xl border px-4 py-4 text-center"
          >
            <p className="text-sm font-semibold">예매가 완료되었습니다.</p>
            <p data-testid="booking-number" className="font-mono text-xs">
              {bookingNo}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
