'use client';

import { useRef, useState } from 'react';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type TermKind = 'cmd' | 'dim' | 'run' | 'pass' | 'fail';
interface TermLine {
  id: string;
  text: string;
  kind: TermKind;
}
const TERM_CLASS: Record<TermKind, string> = {
  cmd: 'text-[#c9d1d9]',
  dim: 'text-[#8b949e]',
  run: 'text-[#d29922]',
  pass: 'text-[#3fb950]',
  fail: 'text-[#f85149]',
};

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
  covers: number[];
  dependsOn: number[];
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
type QualitySeverity = 'warn' | 'error';
interface QualityIssue {
  caseNo: number;
  severity: QualitySeverity;
  message: string;
}
interface GradeResult {
  status: GradeStatus;
  written: number;
  reqCovered: number;
  reqTotal: number;
  uncovered: number[];
  mode: 'ai' | 'static';
  strengths?: string;
  gaps?: string;
}

interface AiVerdict {
  index: number;
  covered: boolean;
  feedback: string;
}
interface AiGrade {
  mode: 'ai';
  requirements: AiVerdict[];
  overall: GradeStatus;
  strengths: string;
  gaps: string;
}

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
    covers: index < reqTotal ? [index] : [],
    dependsOn: [],
  });
  const [rows, setRows] = useState<Row[]>(() => [rowForIndex(0)]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [term, setTerm] = useState<TermLine[]>([]);
  const runRef = useRef(0);

  const named = rows.filter((r) => r.name.trim());
  const written = named.length;
  const coveredSet = new Set<number>();
  named.forEach((r) => {
    r.covers.forEach((reqIndex) => coveredSet.add(reqIndex));
  });
  const reqCovered = coveredSet.size;
  const canSubmit = written >= 1;
  const qualityIssues = rows.flatMap<QualityIssue>((r, index) => {
    const touched =
      r.name.trim() ||
      r.precondition.trim() ||
      r.steps.some((step) => step.trim()) ||
      r.expected.trim();
    if (!touched) return [];

    const issues: QualityIssue[] = [];
    if (!r.name.trim()) {
      issues.push({
        caseNo: index + 1,
        severity: 'error',
        message: '케이스 이름이 비어 있습니다.',
      });
    }
    if (!r.steps.some((step) => step.trim())) {
      issues.push({ caseNo: index + 1, severity: 'error', message: '실행 절차가 없습니다.' });
    }
    if (!r.expected.trim()) {
      issues.push({ caseNo: index + 1, severity: 'error', message: '기대 결과가 비어 있습니다.' });
    } else if (r.expected.trim().length < 10) {
      issues.push({
        caseNo: index + 1,
        severity: 'warn',
        message: '기대 결과를 관찰 가능한 상태로 더 구체화하세요.',
      });
    }
    if (r.covers.length === 0 && r.name.trim()) {
      issues.push({
        caseNo: index + 1,
        severity: 'error',
        message: '검증할 요구사항을 하나 이상 선택하세요.',
      });
    }
    if (index > 0 && r.dependsOn.length === 0 && r.name.trim()) {
      issues.push({
        caseNo: index + 1,
        severity: 'warn',
        message: '선행 TC가 있다면 종속 관계를 지정하세요.',
      });
    }
    r.dependsOn.forEach((dependencyIndex) => {
      if (!rows[dependencyIndex]?.name.trim()) {
        issues.push({
          caseNo: index + 1,
          severity: 'warn',
          message: `종속 대상 TC-${dependencyIndex + 1}의 이름이 비어 있습니다.`,
        });
      }
    });
    return issues;
  });
  const visibleQualityIssues = qualityIssues.slice(0, 5);

  const update = (i: number, key: 'name' | 'priority' | 'precondition' | 'expected', v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, rowForIndex(rs.length)]);
  const removeRow = (i: number) =>
    setRows((rs) =>
      rs.length > 1
        ? rs
            .filter((_, idx) => idx !== i)
            .map((r) => ({
              ...r,
              dependsOn: r.dependsOn
                .filter((dependencyIndex) => dependencyIndex !== i)
                .map((dependencyIndex) =>
                  dependencyIndex > i ? dependencyIndex - 1 : dependencyIndex
                ),
            }))
        : rs
    );

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
  const toggleDependency = (ci: number, dependencyIndex: number) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === ci
          ? {
              ...r,
              dependsOn: r.dependsOn.includes(dependencyIndex)
                ? r.dependsOn.filter((x) => x !== dependencyIndex)
                : [...r.dependsOn, dependencyIndex],
            }
          : r
      )
    );
  const toggleCoverage = (ci: number, reqIndex: number) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === ci
          ? {
              ...r,
              covers: r.covers.includes(reqIndex)
                ? r.covers.filter((x) => x !== reqIndex)
                : [...r.covers, reqIndex].sort((a, b) => a - b),
            }
          : r
      )
    );

  // AI 채점 시도. 키 미설정·오류·타임아웃이면 null → 커버리지로 폴백한다.
  const fetchAiGrade = async (): Promise<AiGrade | null> => {
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          kind: 'testcase',
          submission: {
            cases: named.map((r) => ({
              name: r.name,
              priority: r.priority,
              precondition: r.precondition,
              steps: r.steps.filter((s) => s.trim()),
              expected: r.expected,
              covers: r.covers.map((reqIndex) => '요구-' + (reqIndex + 1)),
              dependsOn: r.dependsOn.map((dependencyIndex) => 'TC-' + (dependencyIndex + 1)),
            })),
          },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as AiGrade;
      if (!Array.isArray(data.requirements)) return null;
      return data;
    } catch {
      return null;
    }
  };

  const grade = async () => {
    const runId = (runRef.current += 1);
    const alive = () => runRef.current === runId;
    const push = (l: TermLine) => {
      if (alive()) setTerm((p) => [...p, l]);
    };
    setGrading(true);
    setResult(null);
    setTerm([]);

    push({ id: 'cmd', text: '$ qaground grade --testcases', kind: 'cmd' });
    await delay(400);
    if (!alive()) return;

    const ai = await fetchAiGrade();
    if (!alive()) return;

    // 요구사항별 판정: AI 결과가 있으면 그것을, 없으면 커버리지(연결 여부)를 쓴다.
    const verdicts = requirements.map((_, i) => {
      if (ai) {
        const v = ai.requirements.find((r) => r.index === i);
        return { covered: v?.covered ?? false, feedback: v?.feedback };
      }
      return { covered: coveredSet.has(i), feedback: undefined as string | undefined };
    });
    const mode: 'ai' | 'static' = ai ? 'ai' : 'static';

    push({
      id: 'hdr',
      text: ai
        ? `AI 채점기가 요구사항 ${reqTotal}개에 대한 케이스 내용을 검토합니다`
        : `요구사항 ${reqTotal}개에 대한 케이스 연결을 검사합니다`,
      kind: 'dim',
    });
    await delay(350);
    if (!alive()) return;

    for (let i = 0; i < reqTotal; i += 1) {
      const v = verdicts[i];
      push({ id: `r-${i}`, text: `  ◌  요구 ${i + 1} 검사 중...`, kind: 'run' });
      await delay(ai ? 220 : 300);
      if (!alive()) return;
      setTerm((p) =>
        p.map((l) =>
          l.id === `r-${i}`
            ? {
                ...l,
                text: `  ${v.covered ? '✓' : '✗'}  요구 ${i + 1} — ${v.covered ? '충족' : '미충족'}`,
                kind: v.covered ? 'pass' : 'fail',
              }
            : l
        )
      );
      if (v.feedback) push({ id: `fb-${i}`, text: `       ↳ ${v.feedback}`, kind: 'dim' });
      await delay(120);
      if (!alive()) return;
    }

    const covCount = verdicts.filter((v) => v.covered).length;
    const status: GradeStatus = ai
      ? ai.overall
      : written === 0 || covCount === 0
        ? 'failed'
        : covCount >= reqTotal
          ? 'passed'
          : 'partial';

    await delay(200);
    if (!alive()) return;
    push({ id: 'blank', text: '', kind: 'dim' });
    if (status === 'passed')
      push({ id: 'sum', text: `  통과 — 요구사항 ${reqTotal}개 모두 충족`, kind: 'pass' });
    else if (status === 'partial')
      push({ id: 'sum', text: `  부분 통과 — ${reqTotal}개 중 ${covCount}개 충족`, kind: 'run' });
    else push({ id: 'sum', text: '  미흡 — 충족된 요구사항이 없습니다', kind: 'fail' });

    const uncovered = verdicts.map((v, i) => (v.covered ? -1 : i)).filter((i) => i >= 0);
    setResult({
      status,
      written,
      reqCovered: covCount,
      reqTotal,
      uncovered,
      mode,
      strengths: ai?.strengths,
      gaps: ai?.gaps,
    });
    setGrading(false);
    track('testcase_submit', { slug, status, mode });
    recordSubmission({ slug, kind: 'testcase', content: { rows }, result: { status, mode } });
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary w-full border px-3 text-sm transition-colors outline-none';

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">테스트 케이스 작성</h2>
        <span className="text-text-3 text-xs">
          작성 {written}개 · 커버리지 {reqCovered}/{reqTotal}
        </span>
      </div>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요구사항을 분석해 케이스를 작성하고, 선행 TC가 필요한 경우 종속 관계를 지정하세요. 모든
        요구사항을 검증할 수 있을 만큼 케이스를 작성하면 통과입니다.
      </p>

      {(visibleQualityIssues.length > 0 || written > 0) && (
        <div className="border-line-2 bg-bg-2 mt-4 border-l-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-2 text-xs font-semibold">품질 점검</span>
            <span className="text-text-3 text-xs">
              {qualityIssues.length === 0
                ? '주요 누락 없음'
                : `${qualityIssues.length}개 확인 필요`}
            </span>
          </div>
          {visibleQualityIssues.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {visibleQualityIssues.map((issue, index) => (
                <li
                  key={`${issue.caseNo}-${index}`}
                  className={
                    issue.severity === 'error'
                      ? 'text-system-red text-xs'
                      : 'text-xs text-[#d29922]'
                  }
                >
                  TC-{issue.caseNo}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

            <div className="mt-2.5">
              <span className="text-text-3 text-xs">요구사항 커버리지</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {requirements.map((requirement, reqIndex) => {
                  const on = r.covers.includes(reqIndex);
                  return (
                    <button
                      key={requirement}
                      type="button"
                      title={requirement}
                      onClick={() => toggleCoverage(i, reqIndex)}
                      className={`border px-2 py-0.5 text-xs transition-colors ${
                        on
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-line-3 text-text-3 hover:text-text-1'
                      }`}
                    >
                      요구 {reqIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {i > 0 && (
              <div className="mt-2.5">
                <span className="text-text-3 text-xs">종속 TC</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {rows.slice(0, i).map((candidate, dependencyIndex) => {
                    const on = r.dependsOn.includes(dependencyIndex);
                    const label = candidate.name.trim() || `TC-${dependencyIndex + 1}`;
                    return (
                      <button
                        key={dependencyIndex}
                        type="button"
                        title={`${label} 완료 후 실행`}
                        onClick={() => toggleDependency(i, dependencyIndex)}
                        className={`border px-2 py-0.5 text-xs transition-colors ${
                          on
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-line-3 text-text-3 hover:text-text-1'
                        }`}
                      >
                        TC-{dependencyIndex + 1}에 종속
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
          disabled={!canSubmit || grading}
          onClick={grade}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {grading ? '채점 중...' : '제출하고 채점'}
        </button>
      </div>

      {(grading || result) && (
        <div data-testid="cases-answer" className="mt-6">
          {/* 채점 콘솔 (자동화처럼 요구사항별로 한 줄씩 검사) */}
          <div className="border-line-2 overflow-hidden rounded-xl border bg-[#0d1117]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]/80" />
              </span>
              <span className="font-mono text-xs text-[#8b949e]">qaground 채점</span>
              {grading && (
                <span className="ml-auto font-mono text-xs text-[#d29922]">채점 중…</span>
              )}
              {!grading && result && (
                <span
                  data-testid="grading-mode-badge"
                  title={
                    result.mode === 'ai'
                      ? '작성한 케이스 내용을 AI가 요구사항별로 평가했습니다. 모범 답안과도 비교해 보세요.'
                      : '케이스 내용이 아니라 요구사항 연결(커버리지)을 보는 구조적 채점입니다. 모범 답안과 직접 비교하세요.'
                  }
                  className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[11px] ${
                    result.mode === 'ai'
                      ? 'border-[#3fb950]/40 text-[#3fb950]'
                      : 'border-white/15 text-[#8b949e]'
                  }`}
                >
                  {result.mode === 'ai' ? 'AI 채점' : '임시 모드'}
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed">
              {term.map((l) => (
                <div key={l.id} className={`${TERM_CLASS[l.kind]} whitespace-pre-wrap`}>
                  {l.text || ' '}
                </div>
              ))}
              {grading && <span className="animate-pulse text-[#8b949e]">▋</span>}
            </div>
          </div>

          {result && !grading && (
            <>
              {(result.strengths || result.gaps) && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {result.strengths && (
                    <div className="border-line-2 bg-bg-3 flex-1 rounded-xl border p-4">
                      <span className="text-xs font-semibold text-[#3fb950]">잘한 점</span>
                      <p className="text-text-2 mt-1 text-sm leading-relaxed">{result.strengths}</p>
                    </div>
                  )}
                  {result.gaps && (
                    <div className="border-line-2 bg-bg-3 flex-1 rounded-xl border p-4">
                      <span className="text-xs font-semibold text-[#d29922]">개선 방향</span>
                      <p className="text-text-2 mt-1 text-sm leading-relaxed">{result.gaps}</p>
                    </div>
                  )}
                </div>
              )}

              {result.uncovered.length > 0 && (
                <div className="mt-4">
                  <p className="text-text-2 text-sm leading-relaxed">
                    아직 충족되지 않은 요구사항입니다. 이 요구사항을 검증하는 케이스를 보강해
                    보세요.
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
            </>
          )}
        </div>
      )}
    </section>
  );
};
