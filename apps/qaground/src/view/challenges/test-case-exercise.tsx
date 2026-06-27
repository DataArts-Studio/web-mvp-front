'use client';

import { useState } from 'react';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';

interface ModelCase {
  title: string;
  detail: string;
}

type Priority = 'high' | 'medium' | 'low';
type Row = { name: string; priority: Priority; steps: string[]; expected: string };

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-[#f85149]/12 text-[#f85149]',
  medium: 'bg-[#d29922]/12 text-[#d29922]',
  low: 'bg-[#3fb950]/12 text-[#3fb950]',
};

const newRow = (): Row => ({ name: '', priority: 'medium', steps: [''], expected: '' });

type GradeStatus = 'passed' | 'partial' | 'failed';
interface GradeResult {
  status: GradeStatus;
  written: number;
  complete: number;
  target: number;
}

const STATUS_META: Record<GradeStatus, { label: string; cls: string }> = {
  passed: { label: '통과', cls: 'text-[#3fb950]' },
  partial: { label: '부분 통과', cls: 'text-[#d29922]' },
  failed: { label: '미흡', cls: 'text-[#f85149]' },
};

/**
 * 테스트 케이스 작성 + 커버리지 채점 (Manual 트랙).
 *
 * 실제 테스트 케이스 도구처럼 케이스 이름(시나리오)·우선순위·절차·기대 결과를 작성한다.
 * 자동 실행이 아니라, 작성한 케이스 수를 핵심 케이스 수와 비교해 통과/부분/미흡으로 채점하고
 * (Playwright 정적 채점과 동일한 구조적 채점) 모범 답안을 공개해 자가비교하게 한다.
 */
export const TestCaseExercise = ({
  slug,
  modelTestCases,
}: {
  slug: string;
  modelTestCases: ModelCase[];
}) => {
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [result, setResult] = useState<GradeResult | null>(null);

  const target = modelTestCases.length;
  const written = rows.filter((r) => r.name.trim()).length;
  const complete = rows.filter((r) => r.name.trim() && r.expected.trim()).length;
  const canSubmit = written >= 1;

  const update = (i: number, key: keyof Row, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, newRow()]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const updateStep = (ci: number, si: number, v: string) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === ci ? { ...r, steps: r.steps.map((s, j) => (j === si ? v : s)) } : r
      )
    );
  const addStep = (ci: number) =>
    setRows((rs) => rs.map((r, idx) => (idx === ci ? { ...r, steps: [...r.steps, ''] } : r)));
  const removeStep = (ci: number, si: number) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === ci && r.steps.length > 1 ? { ...r, steps: r.steps.filter((_, j) => j !== si) } : r
      )
    );

  const grade = () => {
    const status: GradeStatus =
      complete === 0 ? 'failed' : complete >= target ? 'passed' : 'partial';
    const res: GradeResult = { status, written, complete, target };
    setResult(res);
    track('testcase_submit', { slug, status });
    recordSubmission({ slug, kind: 'testcase', content: { rows }, result: { status } });
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary w-full border px-3 text-sm transition-colors outline-none';

  return (
    <section className="border-line-2 bg-bg-2 rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">테스트 케이스 작성</h2>
        <span className="text-text-3 text-xs">
          작성 {written}개 · 핵심 {target}개
        </span>
      </div>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요구사항을 분석해 케이스를 작성하세요. 핵심 케이스 수만큼 작성하면 통과입니다. 제출하면 채점
        결과와 모범 답안이 나타납니다.
      </p>

      <ol className="mt-5 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="border-line-2 bg-bg-1 rounded-xl border p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-text-3 font-mono text-xs">TC-{i + 1}</span>
              <select
                aria-label="우선순위"
                value={r.priority}
                onChange={(e) => update(i, 'priority', e.target.value)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium outline-none ${PRIORITY_BADGE[r.priority]}`}
              >
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                  <option key={p} value={p} className="bg-bg-2 text-text-1">
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="케이스 삭제"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                className="text-text-3 hover:text-text-1 ml-auto text-sm transition-colors disabled:opacity-30"
              >
                ✕
              </button>
            </div>
            <input
              data-testid="case-scenario"
              value={r.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              placeholder="케이스 이름 (시나리오) — 예: 최소 금액 미달 시 쿠폰 거부"
              className={`h-button-md ${fieldClass}`}
            />
            <div className="mt-2">
              <span className="text-text-3 text-xs">절차</span>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {r.steps.map((s, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className="text-text-3 w-4 shrink-0 text-right font-mono text-xs">
                      {si + 1}
                    </span>
                    <input
                      data-testid="case-steps"
                      value={s}
                      onChange={(e) => updateStep(i, si, e.target.value)}
                      placeholder={si === 0 ? '예: 19,999원 주문에 쿠폰 적용' : '다음 단계'}
                      className={`h-button-md ${fieldClass}`}
                    />
                    <button
                      type="button"
                      aria-label="단계 삭제"
                      onClick={() => removeStep(i, si)}
                      disabled={r.steps.length <= 1}
                      className="text-text-3 hover:text-text-1 shrink-0 text-sm transition-colors disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addStep(i)}
                className="text-text-2 hover:text-text-1 mt-1.5 ml-6 text-xs transition-colors"
              >
                + 단계 추가
              </button>
            </div>
            <textarea
              data-testid="case-expected"
              value={r.expected}
              onChange={(e) => update(i, 'expected', e.target.value)}
              rows={2}
              placeholder="기대 결과 — 예: 적용되지 않고 안내가 표시됨"
              className={`mt-2 resize-none py-2 ${fieldClass}`}
            />
          </li>
        ))}
      </ol>

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
          disabled={!canSubmit}
          onClick={grade}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          제출하고 채점
        </button>
      </div>

      {result && (
        <div data-testid="cases-answer" className="border-line-2 mt-6 border-t pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${STATUS_META[result.status].cls}`}>
              {STATUS_META[result.status].label}
            </span>
            <span className="text-text-3 text-xs">
              핵심 {result.target}개 중 {Math.min(result.complete, result.target)}개 작성 (총{' '}
              {result.written}개)
            </span>
            <span
              data-testid="grading-mode-badge"
              title="케이스 내용의 정확도가 아니라 작성 수(커버리지)만 보는 구조적 채점입니다. 모범 답안과 직접 비교하세요."
              className="border-line-3 bg-bg-1 text-text-3 ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium"
            >
              임시 모드
            </span>
          </div>

          {result.status === 'failed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              기대 결과까지 채운 케이스가 없습니다. 케이스 이름과 기대 결과를 작성해 다시
              제출하세요.
            </p>
          )}
          {result.status === 'partial' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              핵심 케이스 수보다 적게 작성했습니다. 아래 모범 답안과 비교해 놓친 시나리오(경계·예외
              등)를 추가해 보세요.
            </p>
          )}
          {result.status === 'passed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              핵심 케이스 수만큼 작성했습니다. 아래 모범 답안과 비교해 관점이 일치하는지 확인해
              보세요.
            </p>
          )}

          <h3 className="text-text-1 mt-5 text-sm font-semibold">
            모범 답안 · 핵심 케이스 {modelTestCases.length}개
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
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
