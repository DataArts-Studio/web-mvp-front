'use client';

import { useState } from 'react';

/**
 * 포인트 정산 샌드박스 (테스트 대상 · 시나리오형).
 *
 * 규칙:
 * - 회원 등급 적립률: 일반 1% · 실버 2% · 골드 5%.
 * - 포인트는 최소 1,000p 부터 사용 가능. 미만이면 에러(미적용).
 * - 포인트는 주문 금액의 50% 까지만 사용 가능. 초과 시 에러(미적용).
 * - 최종 결제액 = 주문금액 − 사용포인트.
 * - 적립 예정 = (주문금액 − 사용포인트) × 등급 적립률 (원 단위 내림).
 */

type Grade = 'normal' | 'silver' | 'gold';
const RATE: Record<Grade, number> = { normal: 0.01, silver: 0.02, gold: 0.05 };
const GRADE_LABEL: Record<Grade, string> = { normal: '일반', silver: '실버', gold: '골드' };
const MIN_POINT = 1000;

export const PointsSettlementSandbox = () => {
  const [amount, setAmount] = useState(30000);
  const [grade, setGrade] = useState<Grade>('normal');
  const [usePoints, setUsePoints] = useState(0);

  // 포인트 사용 검증.
  let pointError = '';
  let appliedPoints = usePoints;
  if (usePoints > 0 && usePoints < MIN_POINT) {
    pointError = `포인트는 ${MIN_POINT.toLocaleString()}p 이상부터 사용할 수 있습니다.`;
    appliedPoints = 0;
  } else if (usePoints > amount * 0.5) {
    pointError = '포인트는 주문 금액의 50%까지만 사용할 수 있습니다.';
    appliedPoints = 0;
  }

  const finalAmount = amount - appliedPoints;
  const earned = Math.floor(finalAmount * RATE[grade]);

  const inputClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md w-full border px-3 text-sm outline-none';
  const gradeBtn = (active: boolean) =>
    `rounded-button h-button-md border px-4 text-sm transition-colors ${
      active ? 'border-primary text-primary' : 'border-line-3 text-text-2 hover:text-text-1'
    }`;

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-6 text-xl font-bold">포인트 정산</h1>

        <label className="mb-4 flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">주문 금액</span>
          <input
            data-testid="order-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>

        <p className="text-text-2 mb-2 text-sm">회원 등급</p>
        <div className="mb-4 flex gap-2">
          {(Object.keys(RATE) as Grade[]).map((g) => (
            <button
              key={g}
              data-testid={`grade-${g}`}
              type="button"
              onClick={() => setGrade(g)}
              className={gradeBtn(grade === g)}
            >
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>

        <label className="mb-1 flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">사용 포인트</span>
          <input
            data-testid="use-points"
            type="number"
            value={usePoints}
            onChange={(e) => setUsePoints(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>

        {pointError && (
          <p data-testid="point-error" role="alert" className="text-system-red mt-2 text-sm">
            {pointError}
          </p>
        )}

        <div className="border-line-2 bg-bg-3 mt-5 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-3">최종 결제액</span>
            <span data-testid="final-amount" className="font-medium">
              {finalAmount.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-3">적립 예정</span>
            <span data-testid="earned-points" className="text-primary font-medium">
              {earned.toLocaleString()}p
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};
