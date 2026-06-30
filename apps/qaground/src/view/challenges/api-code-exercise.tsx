'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';
import type { ApiEndpoint } from '@/shared/challenges/registry';
import { type Monaco } from '@monaco-editor/react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="border-line-2 bg-bg-1 text-text-3 flex h-full items-center justify-center border-y text-sm">
      에디터를 불러오는 중...
    </div>
  ),
});

interface ApiCodeResult {
  ok: boolean;
  status: 'passed' | 'partial' | 'failed';
  durationMs?: number;
  score: number;
  maxScore: number;
  passed: number;
  total: number;
  resultToken?: string;
  error?: string;
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

function configureEditor(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  });
}

function starterForApi(apiBase: string, endpoints: ApiEndpoint[]): string {
  const first = endpoints[0];
  const firstPath = first?.path ?? '/products?page=1&limit=5';
  return `// Postman 테스트 스크립트 문법으로 작성합니다.
// pm.sendRequest 로 API를 호출하고, pm.test / pm.expect 로 검증하세요.
pm.sendRequest({
  url: '${apiBase}${firstPath}',
  method: 'GET',
}, (err, res) => {
  pm.test('상품 목록과 페이지 메타데이터를 반환한다', () => {
    pm.expect(err).to.eql(null);
    pm.expect(res.code).to.eql(200);

    const json = res.json();
    pm.expect(json.page).to.eql(1);
    // TODO: 요구사항에 맞춰 limit, total, data 길이도 검증하세요.
  });
});
`;
}

function parseTestTitles(code: string): string[] {
  return Array.from(code.matchAll(/\b(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g)).map((match) => match[1]);
}

export function ApiCodeExercise({
  apiBase,
  slug,
  endpoints,
}: {
  apiBase: string;
  slug: string;
  endpoints: ApiEndpoint[];
}) {
  const router = useRouter();
  const [code, setCode] = useState(() => starterForApi(apiBase, endpoints));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApiCodeResult | null>(null);
  const [message, setMessage] = useState('');
  const [term, setTerm] = useState<TermLine[]>([]);
  const [termH, setTermH] = useState(288);
  const sectionRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const runIdRef = useRef(0);

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: termH };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const total = sectionRef.current?.clientHeight ?? 800;
    const max = Math.max(160, total - 220);
    const next = dragRef.current.startH + (dragRef.current.startY - e.clientY);
    setTermH(Math.min(Math.max(next, 96), max));
  };
  const onResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 포인터 캡처가 없으면 무시한다.
    }
  };

  const grade = async ({ shouldRecord }: { shouldRecord: boolean }) => {
    const runId = (runIdRef.current += 1);
    const alive = () => runIdRef.current === runId;
    const push = (line: TermLine) => {
      if (alive()) setTerm((prev) => [...prev, line]);
    };

    setRunning(true);
    setResult(null);
    setMessage('');
    setTerm([]);

    const titles = parseTestTitles(code);
    push({ id: 'cmd', text: '$ qaground postman-script run', kind: 'cmd' });
    await delay(220);
    push({ id: 'collect', text: `  ◌  테스트 ${titles.length || 1}개 수집 중`, kind: 'run' });

    let httpStatus = 0;
    const grading = (async () => {
      try {
        const res = await fetch(`/api/challenges/${slug}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, shouldRecord }),
        });
        httpStatus = res.status;
        return (await res.json().catch(() => null)) as ApiCodeResult | null;
      } catch {
        return null;
      }
    })();

    await delay(360);
    if (!alive()) return;
    setTerm((prev) =>
      prev.map((line) =>
        line.id === 'collect' ? { ...line, text: '  ✓  테스트 수집 완료', kind: 'pass' } : line
      )
    );

    for (let i = 0; i < Math.max(titles.length, 1); i += 1) {
      const title = titles[i] ?? 'API 테스트';
      push({ id: `run-${i}`, text: `  ◌  ${title}`, kind: 'run' });
      await delay(260);
      if (!alive()) return;
      setTerm((prev) =>
        prev.map((line) =>
          line.id === `run-${i}` ? { ...line, text: `  ✓  ${title}`, kind: 'pass' } : line
        )
      );
    }

    push({ id: 'grade', text: shouldRecord ? '  ◌  제출 채점 중' : '  ◌  예제 채점 중', kind: 'run' });
    const data = await grading;
    if (!alive()) return;

    if (!data || httpStatus >= 400) {
      setMessage(data?.error ?? '채점에 실패했습니다.');
      setTerm((prev) =>
        prev.map((line) =>
          line.id === 'grade' ? { ...line, text: '  ✗  채점 실패', kind: 'fail' } : line
        )
      );
      setRunning(false);
      return;
    }

    const ok = data.ok;
    setResult(data);
    setTerm((prev) =>
      prev.map((line) =>
        line.id === 'grade'
          ? {
              ...line,
              text: `  ${ok ? '✓' : '◌'}  ${data.score}/${data.maxScore}점`,
              kind: ok ? 'pass' : 'run',
            }
          : line
      )
    );
    if (!ok) {
      push({
        id: 'hint',
        text: '  요구사항별 API 호출, 상태 코드 단언, 응답 본문 단언을 모두 작성하세요.',
        kind: 'dim',
      });
    }

    track(shouldRecord ? 'api_code_submit' : 'api_code_grade', {
      slug,
      status: data.status,
      score: data.score,
    });

    if (shouldRecord) {
      recordSubmission({
        slug,
        kind: 'api',
        content: { code },
        result: { status: data.status, score: data.score, maxScore: data.maxScore },
      });
    }

    if (shouldRecord && data.ok) {
      try {
        window.sessionStorage.setItem(`qaground:last-submission:${slug}`, code);
      } catch {
        // 결과 페이지 비교는 부가 기능이므로 저장 실패는 무시한다.
      }
      const tokenQuery = data.resultToken ? `?token=${encodeURIComponent(data.resultToken)}` : '';
      router.push(`/challenges/${slug}/result${tokenQuery}`);
    }
    setRunning(false);
  };

  return (
    <section ref={sectionRef} className="flex h-full min-h-0 flex-col">
      <div className="border-line-2 flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <span className="text-text-2 text-sm font-medium">API 테스트 코드</span>
        <span className="text-text-3 hidden text-xs sm:inline">Postman 스크립트 문법으로 테스트를 작성하세요.</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => grade({ shouldRecord: false })}
            disabled={running}
            className="border-line-3 text-text-1 hover:bg-bg-3 active:bg-bg-4 inline-flex h-9 items-center justify-center border px-4 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {running ? '실행 중...' : '예제 실행'}
          </button>
          <button
            type="button"
            onClick={() => grade({ shouldRecord: true })}
            disabled={running}
            className="bg-primary hover:bg-primary/90 active:bg-primary/80 inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {running ? '실행 중...' : '제출'}
          </button>
        </div>
      </div>

      <div className="h-[48vh] min-h-0 flex-1 lg:h-auto">
        <MonacoEditor
          height="100%"
          defaultLanguage="javascript"
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
            fixedOverflowWidgets: true,
          }}
        />
      </div>

      {message && (
        <p className="text-system-red m-4 text-sm" role="alert">
          {message}
        </p>
      )}

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="실행 결과 높이 조절"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="border-line-2 bg-bg-2 hover:bg-primary/20 group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center border-t transition-colors"
      >
        <span aria-hidden className="bg-line-3 group-hover:bg-primary h-0.5 w-8 transition-colors" />
      </div>

      <div
        style={{ height: termH }}
        className="flex shrink-0 flex-col overflow-hidden bg-[#0d1117]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 bg-[#f85149]/80" />
            <span className="h-2.5 w-2.5 bg-[#d29922]/80" />
            <span className="h-2.5 w-2.5 bg-[#3fb950]/80" />
          </span>
          <span className="font-mono text-xs text-[#8b949e]">qaground api judge</span>
          {running && <span className="ml-auto font-mono text-xs text-[#d29922]">실행 중...</span>}
          {result && (
            <span className="ml-auto font-mono text-xs text-[#8b949e]">
              {result.passed}/{result.total} checks
            </span>
          )}
        </div>
        <div className="qg-panel-scrollbar min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed">
          {term.length === 0 && !running ? (
            <span className="text-[#8b949e]">예제 실행 또는 제출을 누르면 채점 로그가 표시됩니다.</span>
          ) : (
            term.map((line) => (
              <div key={line.id} className={`${TERM_CLASS[line.kind]} whitespace-pre-wrap`}>
                {line.text || ' '}
              </div>
            ))
          )}
          {running && <span className="animate-pulse text-[#8b949e]">▋</span>}
        </div>
      </div>
    </section>
  );
}

