'use client';

import { useMemo, useState } from 'react';

type Tab = 'submitted' | 'solution' | 'diff';
type DiffLine =
  | { type: 'same'; submitted: string; solution: string }
  | { type: 'changed'; submitted: string; solution: string }
  | { type: 'added'; solution: string }
  | { type: 'removed'; submitted: string };

function splitLines(code: string): string[] {
  const lines = code.trimEnd().split('\n');
  return lines.length === 1 && lines[0] === '' ? [] : lines;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCodeLine(line: string): string {
  const escaped = escapeHtml(line);
  if (escaped.trimStart().startsWith('//')) {
    return `<span class="text-[#8b949e] italic">${escaped}</span>`;
  }

  return escaped
    .replace(/(\/[^\/\n]+\/[gimsuy]*)/g, '<span class="text-[#a5d6ff]">$1</span>')
    .replace(/(['`"])(.*?)(\1)/g, '<span class="text-[#a5d6ff]">$1$2$3</span>')
    .replace(
      /\b(async|await|const|let|return|import|from|test|expect|true|false)\b/g,
      '<span class="text-[#ff7b72]">$1</span>'
    )
    .replace(/\b(page|locator|success|error)\b/g, '<span class="text-[#d2a8ff]">$1</span>')
    .replace(
      /\b(fill|click|goto|getByTestId|toHaveText|toBeVisible|not)\b/g,
      '<span class="text-[#79c0ff]">$1</span>'
    )
    .replace(/\b(\d+)\b/g, '<span class="text-[#79c0ff]">$1</span>');
}

function CodeLine({ line }: { line: string }) {
  return (
    <code
      className="block min-w-0 break-words whitespace-pre-wrap text-[#c9d1d9]"
      dangerouslySetInnerHTML={{ __html: highlightCodeLine(line || ' ') }}
    />
  );
}

function buildLineDiff(submittedCode: string, solutionCode: string): DiffLine[] {
  const submitted = splitLines(submittedCode);
  const solution = splitLines(solutionCode);
  const max = Math.max(submitted.length, solution.length);

  return Array.from({ length: max }, (_, index) => {
    const left = submitted[index];
    const right = solution[index];

    if (left === undefined) return { type: 'added', solution: right ?? '' };
    if (right === undefined) return { type: 'removed', submitted: left };
    if (left === right) return { type: 'same', submitted: left, solution: right };
    return { type: 'changed', submitted: left, solution: right };
  });
}

function CodePanel({ code, title }: { code: string; title: string }) {
  const lines = splitLines(code);

  return (
    <div className="border-line-2 bg-bg-2 min-w-0 overflow-hidden border">
      <div className="border-line-2 bg-bg-3 flex h-10 items-center border-b px-3">
        <span className="text-text-2 text-sm font-medium">{title}</span>
        <span className="text-text-3 ml-auto font-mono text-[11px]">spec.ts</span>
      </div>
      <div className="qg-code-scrollbar max-h-[38rem] overflow-y-auto bg-[#0d1117] py-3 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[3rem_minmax(0,1fr)] px-3">
            <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
              {index + 1}
            </span>
            <CodeLine line={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DiffPanel({
  submittedCode,
  solutionCode,
}: {
  submittedCode: string;
  solutionCode: string;
}) {
  const diffLines = useMemo(
    () => buildLineDiff(submittedCode, solutionCode),
    [submittedCode, solutionCode]
  );

  return (
    <div className="border-line-2 bg-bg-2 min-w-0 overflow-hidden border">
      <div className="border-line-2 bg-bg-3 flex h-10 items-center border-b px-3">
        <span className="text-text-2 text-sm font-medium">Diff</span>
        <span className="text-text-3 ml-auto font-mono text-[11px]">submitted ↔ solution</span>
      </div>
      <div className="qg-code-scrollbar max-h-[38rem] overflow-y-auto bg-[#0d1117] py-3 font-mono text-xs leading-5">
        {diffLines.map((line, index) => {
          if (line.type === 'same') {
            return (
              <div key={index} className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] px-3">
                <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
                  {index + 1}
                </span>
                <span className="text-[#6e7681]"> </span>
                <CodeLine line={line.submitted} />
              </div>
            );
          }

          if (line.type === 'added') {
            return (
              <div
                key={index}
                className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] bg-[#1f6f43]/20 px-3"
              >
                <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
                  {index + 1}
                </span>
                <span className="text-[#3fb950]">+</span>
                <CodeLine line={line.solution} />
              </div>
            );
          }

          if (line.type === 'removed') {
            return (
              <div
                key={index}
                className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] bg-[#8e1519]/25 px-3"
              >
                <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
                  {index + 1}
                </span>
                <span className="text-[#f85149]">-</span>
                <CodeLine line={line.submitted} />
              </div>
            );
          }

          return (
            <div key={index} className="border-line-2 border-b border-dashed last:border-b-0">
              <div className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] bg-[#8e1519]/25 px-3">
                <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
                  {index + 1}
                </span>
                <span className="text-[#f85149]">-</span>
                <CodeLine line={line.submitted} />
              </div>
              <div className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] bg-[#1f6f43]/20 px-3">
                <span className="pr-4 text-right text-[#6e7681] tabular-nums select-none">
                  {index + 1}
                </span>
                <span className="text-[#3fb950]">+</span>
                <CodeLine line={line.solution} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function readSubmittedCode(slug: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(`qaground:last-submission:${slug}`) ?? '';
  } catch {
    return '';
  }
}
export function ChallengeSolutionCompare({
  slug,
  solutionCode,
}: {
  slug: string;
  solutionCode: string;
}) {
  const [submittedCode] = useState(() => readSubmittedCode(slug));
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    readSubmittedCode(slug) ? 'submitted' : 'solution'
  );

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: 'submitted', label: '제출 코드', disabled: !submittedCode },
    { id: 'solution', label: '모범답안' },
    { id: 'diff', label: 'Diff', disabled: !submittedCode },
  ];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">코드 비교</h2>
          <p className="text-text-3 mt-1 text-sm leading-relaxed">
            제출 코드, 모범답안, 차이를 탭으로 전환하며 빠진 검증과 테스트 분리를 비교합니다.
          </p>
        </div>
        {!submittedCode && (
          <span className="border-line-3 text-text-3 border px-3 py-1 text-xs">제출 코드 없음</span>
        )}
      </div>

      <div className="border-line-2 bg-bg-2 mt-4 border">
        <div className="border-line-2 flex flex-wrap gap-1 border-b bg-[#111418] px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`h-8 px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                activeTab === tab.id
                  ? 'bg-bg-3 text-text-1 border-line-3 border'
                  : 'text-text-3 hover:text-text-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {activeTab === 'submitted' && submittedCode && (
            <CodePanel title="제출 코드" code={submittedCode} />
          )}
          {activeTab === 'solution' && <CodePanel title="모범답안" code={solutionCode} />}
          {activeTab === 'diff' && submittedCode && (
            <DiffPanel submittedCode={submittedCode} solutionCode={solutionCode} />
          )}
        </div>
      </div>
    </section>
  );
}
