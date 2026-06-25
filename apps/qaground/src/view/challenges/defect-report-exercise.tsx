'use client';

import { useState } from 'react';

import Link from 'next/link';

import { track } from '@/shared/analytics/track';

interface Defect {
  title: string;
  detail: string;
}

const SEVERITIES = ['낮음', '보통', '높음', '긴급'] as const;

/**
 * 버그 찾기 결함 리포트 제출 + 정답/피드백 (Manual 트랙).
 *
 * 자동 채점이 아니라, 우리가 제공하는 리포트 양식으로 제출하면
 * 의도적으로 심은 결함(정답)과 자가비교 피드백을 보여준다.
 */
export const DefectReportExercise = ({
  sandboxSlug,
  knownDefects,
}: {
  sandboxSlug?: string;
  knownDefects: Defect[];
}) => {
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState<string>('보통');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = title.trim() && steps.trim() && actual.trim();

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary border px-3 py-2 text-sm transition-colors outline-none';

  return (
    <section className="border-line-2 bg-bg-2 mt-8 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">결함 리포트 제출</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        연습 대상에서 결함을 찾아 아래 양식으로 리포트를 작성해 제출하세요. 제출하면 정답과 피드백이
        나타납니다.
      </p>

      {sandboxSlug && (
        <Link
          href={`/sandbox/${sandboxSlug}`}
          target="_blank"
          className="border-line-3 rounded-button text-text-1 hover:bg-bg-3 mt-4 inline-flex h-9 items-center justify-center px-4 text-sm transition-colors"
        >
          연습 대상 열기
        </Link>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">제목</span>
          <input
            data-testid="report-title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="무엇이 어디서 어떻게 잘못되는지 한 줄로"
            className={`h-button-md ${fieldClass}`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">재현 절차</span>
          <textarea
            data-testid="report-steps"
            value={steps}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSteps(e.target.value)}
            rows={3}
            placeholder={'1. ...\n2. ...\n3. ...'}
            className={fieldClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-text-2 text-sm">기대 결과</span>
            <input
              data-testid="report-expected"
              value={expected}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpected(e.target.value)}
              className={`h-button-md ${fieldClass}`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-text-2 text-sm">실제 결과</span>
            <input
              data-testid="report-actual"
              value={actual}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActual(e.target.value)}
              className={`h-button-md ${fieldClass}`}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">심각도</span>
          <select
            data-testid="report-severity"
            value={severity}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverity(e.target.value)}
            className={`h-button-md w-32 ${fieldClass}`}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        data-testid="report-submit"
        type="button"
        disabled={!canSubmit || submitted}
        onClick={() => {
          track('defect_submit');
          setSubmitted(true);
        }}
        className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-5 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        제출하고 정답 확인
      </button>

      {submitted && (
        <div data-testid="report-answer" className="border-line-2 mt-6 border-t pt-6">
          <h3 className="text-primary text-sm font-semibold">
            정답 · 이 페이지의 결함 {knownDefects.length}개
          </h3>
          <p className="text-text-2 mt-2 text-sm leading-relaxed">
            작성하신 리포트를 아래와 비교해 보세요. {knownDefects.length}개를 모두 찾으셨나요?
            빠뜨린 결함이 있다면 어떤 단서를 놓쳤는지 되짚어 보세요.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
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
