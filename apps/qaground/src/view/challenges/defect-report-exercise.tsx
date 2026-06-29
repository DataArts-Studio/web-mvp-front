'use client';

import { useState } from 'react';

import Link from 'next/link';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';

interface Defect {
  title: string;
  detail: string;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';
type Row = { title: string; severity: Severity; steps: string; expected: string; actual: string };

const SEVERITY_LABEL: Record<Severity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '긴급',
};

const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'bg-[#3fb950]/12 text-[#3fb950]',
  medium: 'bg-[#d29922]/12 text-[#d29922]',
  high: 'bg-[#f0883e]/12 text-[#f0883e]',
  critical: 'bg-[#f85149]/12 text-[#f85149]',
};

const newRow = (): Row => ({ title: '', severity: 'medium', steps: '', expected: '', actual: '' });

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
 * 버그 찾기 결함 리포트 작성 + 발견 커버리지 채점 (Manual 트랙).
 *
 * 연습 대상에 의도적으로 심은 결함을 찾아 여러 건의 리포트로 작성한다.
 * 자동 채점이 아니라, 작성한 리포트 수를 심은 결함 수와 비교해 통과/부분/미흡으로 채점하고
 * (테스트 케이스 채점과 동일한 구조적 채점) 정답 결함을 공개해 자가비교하게 한다.
 */
export const DefectReportExercise = ({
  slug,
  sandboxSlug,
  knownDefects,
}: {
  slug: string;
  sandboxSlug?: string;
  knownDefects: Defect[];
}) => {
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [result, setResult] = useState<GradeResult | null>(null);

  const target = knownDefects.length;
  const written = rows.filter((r) => r.title.trim()).length;
  const complete = rows.filter((r) => r.title.trim() && r.actual.trim()).length;
  const canSubmit = written >= 1;

  const update = (i: number, key: keyof Row, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, newRow()]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const grade = () => {
    const status: GradeStatus =
      complete === 0 ? 'failed' : complete >= target ? 'passed' : 'partial';
    const res: GradeResult = { status, written, complete, target };
    setResult(res);
    track('defect_submit', { slug, status });
    recordSubmission({ slug, kind: 'defect', content: { rows }, result: { status } });
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary w-full border px-3 text-sm transition-colors outline-none';

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">결함 리포트 작성</h2>
        <span className="text-text-3 text-xs">
          작성 {written}건 · 심은 결함 {target}개
        </span>
      </div>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        연습 대상을 살펴보며 결함을 찾아 리포트로 작성하세요. 심은 결함 수만큼 찾으면 통과입니다.
        제출하면 채점 결과와 정답이 나타납니다.
      </p>

      {sandboxSlug && (
        <Link
          href={`/sandbox/${sandboxSlug}`}
          target="_blank"
          className="border-line-3 rounded-button text-text-1 hover:bg-bg-3 mt-4 inline-flex h-9 items-center justify-center px-4 text-sm transition-colors"
        >
          연습 대상 열기 ↗
        </Link>
      )}

      <ol className="mt-5 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="border-line-2 bg-bg-1 rounded-xl border p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-text-3 font-mono text-xs">#{i + 1}</span>
              <select
                aria-label="심각도"
                value={r.severity}
                onChange={(e) => update(i, 'severity', e.target.value)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium outline-none ${SEVERITY_BADGE[r.severity]}`}
              >
                {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                  <option key={s} value={s} className="bg-bg-2 text-text-1">
                    {SEVERITY_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="결함 삭제"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                className="text-text-3 hover:text-text-1 ml-auto text-sm transition-colors disabled:opacity-30"
              >
                ✕
              </button>
            </div>
            <input
              data-testid="report-title"
              value={r.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="제목 — 무엇이 어디서 어떻게 잘못되는지 한 줄로"
              className={`h-button-md ${fieldClass}`}
            />
            <textarea
              data-testid="report-steps"
              value={r.steps}
              onChange={(e) => update(i, 'steps', e.target.value)}
              rows={2}
              placeholder={'재현 절차 — 1. ... 2. ...'}
              className={`mt-2 resize-none py-2 ${fieldClass}`}
            />
            <textarea
              data-testid="report-expected"
              value={r.expected}
              onChange={(e) => update(i, 'expected', e.target.value)}
              rows={2}
              placeholder="기대 결과"
              className={`mt-2 resize-none py-2 ${fieldClass}`}
            />
            <textarea
              data-testid="report-actual"
              value={r.actual}
              onChange={(e) => update(i, 'actual', e.target.value)}
              rows={2}
              placeholder="실제 결과 (결함)"
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
        + 결함 추가
      </button>

      <div className="mt-5">
        <button
          data-testid="report-submit"
          type="button"
          disabled={!canSubmit}
          onClick={grade}
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          제출하고 채점
        </button>
      </div>

      {result && (
        <div data-testid="report-answer" className="border-line-2 mt-6 border-t pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${STATUS_META[result.status].cls}`}>
              {STATUS_META[result.status].label}
            </span>
            <span className="text-text-3 text-xs">
              심은 결함 {result.target}개 중 {Math.min(result.complete, result.target)}건 작성 (총{' '}
              {result.written}건)
            </span>
            <span
              data-testid="grading-mode-badge"
              title="리포트 내용의 정확도가 아니라 작성 건수(커버리지)만 보는 구조적 채점입니다. 정답과 직접 비교하세요."
              className="border-line-3 bg-bg-1 text-text-3 ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium"
            >
              임시 모드
            </span>
          </div>

          {result.status === 'failed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              실제 결과까지 채운 리포트가 없습니다. 제목과 실제 결과를 작성해 다시 제출하세요.
            </p>
          )}
          {result.status === 'partial' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              심은 결함 수보다 적게 찾았습니다. 아래 정답과 비교해 놓친 결함의 단서를 되짚어 보세요.
            </p>
          )}
          {result.status === 'passed' && (
            <p className="text-text-2 mt-3 text-sm leading-relaxed">
              심은 결함 수만큼 찾았습니다. 아래 정답과 비교해 같은 결함을 짚었는지 확인해 보세요.
            </p>
          )}

          <h3 className="text-text-1 mt-5 text-sm font-semibold">
            정답 · 이 페이지의 결함 {knownDefects.length}개
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {knownDefects.map((d) => (
              <li key={d.title} className="border-line-2 bg-bg-3 rounded-xl border p-4">
                <span className="text-text-1 text-sm font-medium">{d.title}</span>
                <p className="text-text-2 mt-1 text-sm leading-relaxed">{d.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
