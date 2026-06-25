'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';
import type { ChallengeSelector } from '@/shared/challenges/registry';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="border-line-2 bg-bg-1 text-text-3 flex h-[340px] items-center justify-center rounded-xl border text-sm">
      에디터를 불러오는 중...
    </div>
  ),
});

type Status = 'idle' | 'submitting' | 'result' | 'unavailable' | 'error';
interface RunResult {
  ok: boolean;
  status: string;
  durationMs?: number;
  errorMessage?: string;
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

  const submit = async () => {
    setStatus('submitting');
    setResult(null);
    setMessage('');
    try {
      const res = await fetch(`/api/challenges/${slug}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => null)) as (RunResult & { error?: string }) | null;
      if (res.status === 503) {
        setStatus('unavailable');
        setMessage(data?.error ?? '채점 서버가 아직 연결되지 않았습니다.');
        return;
      }
      if (!res.ok || !data) {
        setStatus('error');
        setMessage(data?.error ?? '제출에 실패했습니다.');
        return;
      }
      setResult(data);
      setStatus('result');
      track('code_submit', { slug, status: data.status, ok: data.ok });
      recordSubmission({
        slug,
        kind: 'code',
        content: { code },
        result: { status: data.status, ok: data.ok },
      });
    } catch {
      setStatus('error');
      setMessage('제출에 실패했습니다.');
    }
  };

  return (
    <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">코드 작성 · 자동 채점</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        아래 에디터에 Playwright 테스트를 작성해 제출하면, 격리된 러너가 연습 대상에서 실행해
        통과/실패를 채점합니다.
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
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      <button
        data-testid="code-submit"
        type="button"
        onClick={submit}
        disabled={status === 'submitting'}
        className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-5 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? '채점 중...' : '제출하고 채점'}
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
      {status === 'result' && result && (
        <div
          data-testid="code-result"
          className="border-line-2 bg-bg-3 mt-5 flex flex-col gap-2 rounded-xl border p-4"
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${result.ok ? 'text-primary' : 'text-system-red'}`}
            >
              {result.ok ? '통과' : '실패'}
            </span>
            <span className="text-text-3 text-xs">
              {result.status}
              {typeof result.durationMs === 'number' ? ` · ${result.durationMs}ms` : ''}
            </span>
          </div>
          {result.errorMessage && (
            <pre className="text-text-2 max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap">
              {result.errorMessage}
            </pre>
          )}
        </div>
      )}
    </section>
  );
};
