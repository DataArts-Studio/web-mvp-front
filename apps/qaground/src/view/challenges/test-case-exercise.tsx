'use client';

import { useState } from 'react';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';

interface ModelCase {
  title: string;
  detail: string;
}

type Row = { scenario: string; expected: string };

const EMPTY_ROW: Row = { scenario: '', expected: '' };

/**
 * 테스트 케이스 작성 제출 + 모범 답안/피드백 (Manual 트랙).
 *
 * 자동 채점이 아니라, 우리가 제공하는 표 양식으로 케이스를 작성해 제출하면
 * 모범 답안(핵심 케이스)과 자가비교 피드백을 보여준다.
 */
export const TestCaseExercise = ({
  slug,
  modelTestCases,
}: {
  slug: string;
  modelTestCases: ModelCase[];
}) => {
  const [rows, setRows] = useState<Row[]>([EMPTY_ROW, EMPTY_ROW, EMPTY_ROW]);
  const [submitted, setSubmitted] = useState(false);

  const update = (i: number, key: keyof Row, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, EMPTY_ROW]);

  const filledCount = rows.filter((r) => r.scenario.trim()).length;
  const canSubmit = filledCount >= 1;

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';

  return (
    <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">테스트 케이스 제출</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요구사항을 보고 테스트 케이스를 작성해 제출하세요. 제출하면 모범 답안과 피드백이 나타납니다.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <div className="text-text-3 grid grid-cols-[1fr_1fr] gap-3 text-xs">
          <span>시나리오</span>
          <span>기대 결과</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr] gap-3">
            <input
              data-testid="case-scenario"
              value={r.scenario}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update(i, 'scenario', e.target.value)
              }
              placeholder="예: 최소 금액 미달 시 쿠폰 거부"
              className={fieldClass}
            />
            <input
              data-testid="case-expected"
              value={r.expected}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update(i, 'expected', e.target.value)
              }
              placeholder="예: 적용되지 않고 안내가 표시됨"
              className={fieldClass}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="text-text-2 hover:text-text-1 mt-3 text-sm transition-colors"
      >
        + 케이스 추가
      </button>

      <div className="mt-5">
        <button
          data-testid="cases-submit"
          type="button"
          disabled={!canSubmit || submitted}
          onClick={() => {
            track('testcase_submit');
            recordSubmission({ slug, kind: 'testcase', content: { rows } });
            setSubmitted(true);
          }}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          제출하고 모범 답안 확인
        </button>
      </div>

      {submitted && (
        <div data-testid="cases-answer" className="border-line-2 mt-6 border-t pt-6">
          <h3 className="text-primary text-sm font-semibold">
            모범 답안 · 핵심 케이스 {modelTestCases.length}개
          </h3>
          <p className="text-text-2 mt-2 text-sm leading-relaxed">
            작성하신 {filledCount}개 케이스를 아래와 비교해 보세요. 빠뜨린 시나리오가 있다면 어떤
            관점을 놓쳤는지 되짚어 보세요.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {modelTestCases.map((c) => (
              <li key={c.title} className="border-line-2 bg-bg-3 rounded-xl border p-4">
                <span className="text-text-1 text-sm font-medium">{c.title}</span>
                <p className="text-text-2 mt-1 text-sm leading-relaxed">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
