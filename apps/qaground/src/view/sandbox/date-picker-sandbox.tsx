'use client';

import { useState } from 'react';

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * 날짜 선택기 샌드박스 (테스트 대상).
 * - 입력을 누르면 달력이 열리고, 날짜를 고르면 입력에 반영되고 달력이 닫힌다.
 */
export const DatePickerSandbox = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');

  const pick = (d: number) => {
    setSelected(`2026-07-${String(d).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-start justify-center px-4 py-16 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-xs flex-col gap-3 rounded-2xl border p-6">
        <h1 className="text-lg font-bold">예약 날짜</h1>
        <input
          data-testid="date-input"
          readOnly
          value={selected}
          placeholder="날짜를 선택하세요"
          onClick={() => setOpen((o) => !o)}
          className="border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 h-button-md cursor-pointer border px-3 text-sm outline-none"
        />
        {open && (
          <div data-testid="calendar" className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <button
                key={d}
                data-testid="day-cell"
                onClick={() => pick(d)}
                className="hover:bg-primary/20 rounded-md py-1.5 text-center text-sm transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
        )}
        {selected && (
          <p data-testid="selected-date" className="text-primary text-sm font-medium">
            선택: {selected}
          </p>
        )}
      </div>
    </main>
  );
};
