'use client';

import { useState } from 'react';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';

interface ModelCase {
  title: string;
  detail: string;
}

type Priority = 'high' | 'medium' | 'low';
type Row = {
  name: string;
  priority: Priority;
  precondition: string;
  steps: string[];
  expected: string;
  reqs: number[];
};

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

type GradeStatus = 'passed' | 'partial' | 'failed';
interface GradeResult {
  status: GradeStatus;
  written: number;
  reqCovered: number;
  reqTotal: number;
  uncovered: number[];
}

const STATUS_META: Record<GradeStatus, { label: string; cls: string }> = {
  passed: { label: '통과', cls: 'text-[#3fb950]' },
  partial: { label: '부분 통과', cls: 'text-[#d29922]' },
  failed: { label: '미흡', cls: 'text-[#f85149]' },
};

/**
 * 테스트 케이스 작성 + 요구사항 커버리지 채점 (Manual 트랙).
 *
 * 실제 도구처럼 케이스 이름·우선순위·사전조건·절차·기대 결과를 작성하고, 각 케이스가
 * 어떤 요구사항을 검증하는지 연결(추적성)한다. 채점은 요구사항 N개 중 케이스가 연결된
 * 수(커버리지)로 통과/부분/미흡을 매기고, 모범 답안을 공개해 자가비교하게 한다.
 */
export const TestCaseExercise = ({
  slug,
  modelTestCases,
  requirements,
}: {
  slug: string;
  modelTestCases: ModelCase[];
  requirements: string[];
}) => {
  const reqTotal = requirements.length;
  // 새 케이스는 자기 번호에 해당하는 요구사항을 기본 연결한다(TC-1→요구1 …). 토글로 변경 가능.
  const rowForIndex = (index: number): Row => ({
    name: '',
    priority: 'medium',
    precondition: '',
    steps: [''],
    expected: '',
    reqs: index < reqTotal ? [index] : [],
  });
  const [rows, setRows] = useState<Row[]>(() => [rowForIndex(0)]);
  const [result, setResult] = useState<GradeResult | null>(null);

  const named = rows.filter((r) => r.name.trim());
  const written = named.length;
  const coveredSet = new Set<number>();
  named.forEach((r) => r.reqs.forEach((i) => coveredSet.add(i)));
  const reqCovered = coveredSet.size;
  const canSubmit = written >= 1;

  const update = (i: number, key: 'name' | 'priority' | 'precondition' | 'expected', v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, rowForIndex(rs.length)]);
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
  const toggleReq = (ci: number, ri: number) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === ci
          ? { ...r, reqs: r.reqs.includes(ri) ? r.reqs.filter((x) => x !== ri) : [...r.reqs, ri] }
          : r
      )
    );

  const grade = () => {
    const uncovered = requirements.map((_, i) => i).filter((i) => !coveredSet.has(i));
    const status: GradeStatus =
      written === 0 || reqCovered === 0 ? 'failed' : reqCovered >= reqTotal ? 'passed' : 'partial';
    const res: GradeResult = { status, written, reqCovered, reqTotal, uncovered };
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
          요구사항 {reqTotal}개 중 {reqCovered}개 연결 · 작성 {written}개
        </span>
      </div>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요구사항을 분석해 케이스를 작성하고, 각 케이스가 검증하는 요구사항을 연결하세요. 모든
        요구사항에 케이스를 연결하면 통과입니다. 제출하면 채점 결과와 모범 답안이 나타납니다.
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

            <input
              data-testid="case-precondition"
              value={r.precondition}
              onChange={(e) => update(i, 'precondition', e.target.value)}
              placeholder="사전조건 — 예: 만료되지 않은 쿠폰이 발급된 상태"
              className={`h-button-md mt-2 ${fieldClass}`}
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

            {reqTotal > 0 && (
              <div className="mt-2.5">
                <span className="text-text-3 text-xs">연관 요구사항</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {requirements.map((req, ri) => {
                    const on = r.reqs.includes(ri);
                    return (
                      <button
                        key={ri}
                        type="button"
                        title={req}
                        onClick={() => toggleReq(i, ri)}
                        className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          on
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-line-3 text-text-3 hover:text-text-1'
                        }`}
                      >
                        요구 {ri + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
              요구사항 {result.reqTotal}개 중 {result.reqCovered}개 케이스 연결 (작성{' '}
              {result.written}개)
            </span>
            <span
              data-testid="grading-mode-badge"
              title="케이스 내용의 정확도가 아니라 요구사항 연결(커버리지)을 보는 구조적 채점입니다. 모범 답안과 직접 비교하세요."
              className="border-line-3 bg-bg-1 text-text-3 ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium"
            >
              임시 모드
            </span>
          </div>

          {result.status === 'failed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              요구사항에 연결된 케이스가 없습니다. 케이스를 작성하고 아래 "연관 요구사항"에서 해당
              요구사항을 연결한 뒤 다시 제출하세요.
            </p>
          )}
          {result.status === 'partial' && result.uncovered.length > 0 && (
            <div className="mt-3">
              <p className="text-text-2 text-sm leading-relaxed">
                아직 케이스가 연결되지 않은 요구사항이 있습니다. 아래 요구사항을 검증하는 케이스를
                추가해 보세요.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {result.uncovered.map((ri) => (
                  <li key={ri} className="text-sm leading-relaxed text-[#f85149]">
                    ✗ 요구 {ri + 1}. {requirements[ri]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.status === 'passed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              모든 요구사항에 케이스를 연결했습니다. 아래 모범 답안과 비교해 경계·예외 케이스까지
              빠짐없이 도출했는지 확인해 보세요.
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
