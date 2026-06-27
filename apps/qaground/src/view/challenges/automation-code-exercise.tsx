'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';
import type { ChallengeSelector } from '@/shared/challenges/registry';
import { type Monaco } from '@monaco-editor/react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="border-line-2 bg-bg-1 text-text-3 flex h-[340px] items-center justify-center rounded-xl border text-sm">
      에디터를 불러오는 중...
    </div>
  ),
});

/**
 * 에디터는 @playwright/test 타입을 로드하지 않으므로 "모듈을 찾을 수 없음"(의미 진단)과
 * "import 했는데 안 씀"(제안/미사용 진단) 같은 표시를 끈다. 스타터가 expect 를 import 만
 * 하고 본문에서 안 써도 밑줄이 안 생긴다. 실제 검증은 서버 채점이 하므로 이런 표시는 혼란만 준다.
 * (진짜 오타 등 구문 오류는 그대로 표시한다.)
 */
function configureEditor(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  });
}

type Status = 'idle' | 'running' | 'result' | 'unavailable' | 'error';

interface RunResult {
  ok: boolean;
  status: string;
  durationMs?: number;
  errorMessage?: string;
  /** 'static' = 러너 미연결 구간의 임시 정적 채점(코드 미실행). 연결되면 실제 실행 채점. */
  mode?: 'static' | 'runner';
}

type TermKind = 'cmd' | 'dim' | 'pass' | 'fail' | 'run';
interface TermLine {
  id: string;
  text: string;
  kind: TermKind;
}

const TERM_CLASS: Record<TermKind, string> = {
  cmd: 'text-[#c9d1d9]',
  dim: 'text-[#8b949e]',
  pass: 'text-[#3fb950]',
  fail: 'text-[#f85149]',
  run: 'text-[#d29922]',
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 제출 코드에서 test('제목')·it('제목') 의 제목을 추출한다. */
function parseTestTitles(code: string): string[] {
  return Array.from(code.matchAll(/\b(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g)).map((m) => m[1]);
}

function genStarter(selectors: ChallengeSelector[]): string {
  const ids = selectors.map((s) => s.testid).join(', ');
  return `import { test, expect } from '@playwright/test';

// 참고 셀렉터: ${ids}
test('내 테스트', async ({ page }) => {
  await page.goto('/');
  // page.getByTestId('...') 로 동작을 수행하고 expect 로 검증하세요.
});
`;
}

export const AutomationCodeExercise = ({
  slug,
  sandboxSlug,
  selectors,
  starterSpec,
}: {
  slug: string;
  sandboxSlug: string;
  selectors: ChallengeSelector[];
  starterSpec?: string;
}) => {
  const [code, setCode] = useState(starterSpec ?? genStarter(selectors));
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [message, setMessage] = useState('');
  const [term, setTerm] = useState<TermLine[]>([]);
  const runIdRef = useRef(0);

  const submit = async () => {
    const runId = (runIdRef.current += 1);
    const alive = () => runIdRef.current === runId;
    const push = (line: TermLine) => {
      if (alive()) setTerm((prev) => [...prev, line]);
    };

    setStatus('running');
    setResult(null);
    setMessage('');
    setTerm([]);

    const titles = parseTestTitles(code);

    // 채점 요청은 스트리밍과 동시에 시작한다(결과는 빨리 와도 연출은 순차로).
    let httpStatus = 0;
    const grading: Promise<(RunResult & { error?: string }) | null> = (async () => {
      try {
        const res = await fetch(`/api/challenges/${slug}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        httpStatus = res.status;
        return (await res.json().catch(() => null)) as (RunResult & { error?: string }) | null;
      } catch {
        return null;
      }
    })();

    push({ id: 'cmd', text: '$ npx playwright test', kind: 'cmd' });
    await delay(500);
    if (!alive()) return;
    push({
      id: 'hdr',
      text: `Running ${titles.length} test${titles.length === 1 ? '' : 's'} using 1 worker`,
      kind: 'dim',
    });
    await delay(450);
    if (!alive()) return;

    const data = await grading;
    if (!alive()) return;

    if (httpStatus === 503) {
      setStatus('unavailable');
      setMessage(data?.error ?? '채점 서버가 아직 연결되지 않았습니다.');
      return;
    }
    if (!data || httpStatus >= 400) {
      setStatus('error');
      setMessage(data?.error ?? '제출에 실패했습니다.');
      return;
    }

    const ok = data.ok;
    const partial = data.status === 'partial';
    // 통과·부분은 테스트를 정상 작성한 것이므로 ✓, 실패만 ◌.
    const wrote = ok || partial;

    // 테스트 케이스를 한 줄씩 "실행 → 완료" 로 흘린다.
    for (let i = 0; i < titles.length; i += 1) {
      const n = i + 1;
      const title = titles[i];
      push({ id: `run-${n}`, text: `  ◌  ${n} › ${title}`, kind: 'run' });
      await delay(360);
      if (!alive()) return;
      setTerm((prev) =>
        prev.map((l) =>
          l.id === `run-${n}`
            ? {
                ...l,
                text: `  ${wrote ? '✓' : '◌'}  ${n} › ${title}`,
                kind: wrote ? 'pass' : 'dim',
              }
            : l
        )
      );
      await delay(140);
      if (!alive()) return;
    }

    await delay(220);
    if (!alive()) return;
    push({ id: 'blank', text: '', kind: 'dim' });
    if (ok) {
      const ms = typeof data.durationMs === 'number' ? ` (${data.durationMs}ms)` : '';
      push({ id: 'sum', text: `  ${titles.length || 1} passed${ms}`, kind: 'pass' });
    } else if (partial) {
      push({ id: 'sum', text: '  부분 통과 — 요구사항을 모두 작성해야 통과', kind: 'run' });
    } else {
      push({ id: 'sum', text: '  채점 실패 — 아래를 보완하세요', kind: 'fail' });
    }

    // 상세(보완 항목 / 통과·부분 요약)를 줄 단위로. 임시 여부는 헤더의 "임시 모드" 배지로 대신한다.
    (data.errorMessage ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((ln, idx) =>
        push({ id: `msg-${idx}`, text: `  ${ln}`, kind: ok ? 'dim' : partial ? 'run' : 'fail' })
      );

    setResult(data);
    setStatus('result');
    track('code_submit', { slug, status: data.status, ok: data.ok });
    recordSubmission({
      slug,
      kind: 'code',
      content: { code },
      result: { status: data.status, ok: data.ok },
    });
  };

  const running = status === 'running';

  return (
    <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">코드 작성 · 자동 채점</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        아래 에디터에 Playwright 테스트를 작성해 제출하면, 테스트가 한 줄씩 실행되며 통과/실패를
        채점합니다.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/sandbox/${sandboxSlug}`}
          target="_blank"
          className="text-primary text-sm hover:underline"
        >
          연습 대상 열기 ↗
        </Link>
        <span className="text-text-3 text-xs">
          셀렉터: {selectors.map((s) => s.testid).join(', ')}
        </span>
      </div>

      <div className="border-line-2 mt-4 overflow-hidden rounded-xl border">
        <MonacoEditor
          height="460px"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          beforeMount={configureEditor}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            // overflow-hidden 컨테이너에 호버/자동완성 툴팁이 잘리지 않도록 body 에 렌더.
            fixedOverflowWidgets: true,
          }}
        />
      </div>

      <button
        data-testid="code-submit"
        type="button"
        onClick={submit}
        disabled={running}
        className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-5 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:opacity-60"
      >
        {running ? '실행 중...' : '제출하고 채점'}
      </button>

      {status === 'unavailable' && (
        <p className="border-line-3 text-text-3 mt-4 rounded-xl border border-dashed px-4 py-3 text-sm">
          {message} (러너 배포 후 연결됩니다.)
        </p>
      )}
      {status === 'error' && (
        <p className="text-system-red mt-4 text-sm" role="alert">
          {message}
        </p>
      )}

      {(status === 'running' || status === 'result') && (
        <div
          data-testid="code-result"
          className="border-line-2 mt-5 overflow-hidden rounded-xl border bg-[#0d1117]"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]/80" />
            </span>
            <span className="font-mono text-xs text-[#8b949e]">qaground grade</span>
            {running && <span className="ml-auto font-mono text-xs text-[#d29922]">실행 중…</span>}
            {status === 'result' && result?.mode === 'static' && (
              <span
                data-testid="grading-mode-badge"
                title="코드를 실행하지 않고 구조만 점검하는 임시 채점입니다. 러너 연결 시 실제 실행 채점으로 전환됩니다."
                className="ml-auto rounded-full border border-white/15 px-2 py-0.5 font-mono text-[11px] text-[#8b949e]"
              >
                임시 모드
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed">
            {term.map((l) => (
              <div key={l.id} className={`${TERM_CLASS[l.kind]} whitespace-pre-wrap`}>
                {l.text || ' '}
              </div>
            ))}
            {running && <span className="animate-pulse text-[#8b949e]">▋</span>}
          </div>
        </div>
      )}
    </section>
  );
};
