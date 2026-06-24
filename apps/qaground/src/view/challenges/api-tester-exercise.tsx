'use client';

import { useState } from 'react';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
type AssertKind = 'status' | 'json';
interface Assertion {
  id: number;
  kind: AssertKind;
  path: string;
  expected: string;
}
interface Check {
  label: string;
  pass: boolean;
  actual: string;
}
interface RunResult {
  status: number;
  bodyText: string;
  checks: Check[];
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];

/** 점(.) 경로로 JSON 값 탐색. eval 없이 구조적 접근만 한다. (`data.0.id` 등) */
function getByPath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

let nextId = 2;

/**
 * 인앱 API 테스터 + 자동 채점 (API 트랙).
 *
 * 포스트맨처럼 요청을 구성하고 단언을 추가해 실행한다. 사용자 코드를 실행하지 않고
 * (통제된 HTTP 호출 + 구조적 단언 비교만) 채점하므로 격리 러너·임의 코드 실행이 필요 없다.
 */
export const ApiTesterExercise = ({ apiBase }: { apiBase: string }) => {
  const [method, setMethod] = useState<Method>('GET');
  const [path, setPath] = useState('/products?page=1&limit=5');
  const [token, setToken] = useState('');
  const [body, setBody] = useState('');
  const [assertions, setAssertions] = useState<Assertion[]>([
    { id: 1, kind: 'status', path: '', expected: '200' },
  ]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);

  const updateAssertion = (id: number, patch: Partial<Assertion>) =>
    setAssertions((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const addAssertion = () =>
    setAssertions((as) => [...as, { id: nextId++, kind: 'json', path: '', expected: '' }]);
  const removeAssertion = (id: number) => setAssertions((as) => as.filter((a) => a.id !== id));

  const run = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const headers: Record<string, string> = {};
      if (token.trim()) headers['Authorization'] = `Bearer ${token.trim()}`;
      const hasBody = method !== 'GET' && body.trim();
      if (hasBody) headers['Content-Type'] = 'application/json';

      const res = await fetch(apiBase + path, {
        method,
        headers,
        body: hasBody ? body : undefined,
      });

      const bodyText = await res.text();
      let json: unknown = undefined;
      try {
        json = JSON.parse(bodyText);
      } catch {
        json = undefined;
      }

      const checks: Check[] = assertions.map((a) => {
        if (a.kind === 'status') {
          return {
            label: `상태 코드 == ${a.expected}`,
            pass: String(res.status) === a.expected.trim(),
            actual: String(res.status),
          };
        }
        const actual = getByPath(json, a.path);
        const actualStr = actual === undefined ? '(없음)' : JSON.stringify(actual);
        return {
          label: `${a.path || '(경로 없음)'} == ${a.expected}`,
          pass: actual !== undefined && String(actual) === a.expected.trim(),
          actual: actualStr,
        };
      });

      const pretty = json !== undefined ? JSON.stringify(json, null, 2) : bodyText;
      setResult({ status: res.status, bodyText: pretty, checks });
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청 실패');
    } finally {
      setRunning(false);
    }
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary border px-3 text-sm transition-colors outline-none';
  const passCount = result?.checks.filter((c) => c.pass).length ?? 0;
  const total = result?.checks.length ?? 0;

  return (
    <section className="border-line-2 bg-bg-2 mt-8 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">API 테스터 · 자동 채점</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요청을 구성하고 단언을 추가해 실행하면 응답을 채점합니다. 코드를 작성하지 않고 포스트맨처럼
        검증합니다.
      </p>

      {/* 요청 */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <select
            data-testid="api-method"
            value={method}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setMethod(e.target.value as Method)
            }
            className={`h-button-md w-28 ${fieldClass}`}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="text-text-3 h-button-md flex items-center font-mono text-xs">
            {apiBase}
          </span>
          <input
            data-testid="api-path"
            value={path}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
            placeholder="/products?page=1&limit=5"
            className={`h-button-md flex-1 font-mono ${fieldClass}`}
          />
        </div>

        <input
          data-testid="api-token"
          value={token}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
          placeholder="Bearer 토큰 (보호된 요청에만, 예: qaground-demo-token)"
          className={`h-button-md ${fieldClass}`}
        />

        {method !== 'GET' && (
          <textarea
            data-testid="api-body"
            value={body}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
            rows={3}
            placeholder={'요청 본문(JSON)\n{ "name": "테스트 상품", "price": 1000 }'}
            className={`py-2 font-mono ${fieldClass}`}
          />
        )}
      </div>

      {/* 단언 */}
      <div className="mt-5">
        <span className="text-text-2 text-sm font-medium">검증(단언)</span>
        <div className="mt-2 flex flex-col gap-2">
          {assertions.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <select
                value={a.kind}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  updateAssertion(a.id, { kind: e.target.value as AssertKind })
                }
                className={`h-9 w-28 ${fieldClass}`}
              >
                <option value="status">상태 코드</option>
                <option value="json">JSON 필드</option>
              </select>
              {a.kind === 'json' && (
                <input
                  value={a.path}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateAssertion(a.id, { path: e.target.value })
                  }
                  placeholder="경로 (예: total, data.0.name)"
                  className={`h-9 flex-1 font-mono ${fieldClass}`}
                />
              )}
              <span className="text-text-3 text-sm">==</span>
              <input
                value={a.expected}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateAssertion(a.id, { expected: e.target.value })
                }
                placeholder="기대값"
                className={`h-9 w-28 font-mono ${fieldClass}`}
              />
              <button
                type="button"
                onClick={() => removeAssertion(a.id)}
                className="text-text-3 hover:text-system-red px-1 text-sm transition-colors"
                aria-label="단언 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAssertion}
          className="text-text-2 hover:text-text-1 mt-2 text-sm transition-colors"
        >
          + 단언 추가
        </button>
      </div>

      <button
        data-testid="api-run"
        type="button"
        onClick={run}
        disabled={running}
        className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-5 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors disabled:opacity-60"
      >
        {running ? '실행 중...' : '실행하고 채점'}
      </button>

      {error && (
        <p className="text-system-red mt-4 text-sm" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div data-testid="api-result" className="border-line-2 mt-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <span className="text-text-2 text-sm">응답 상태</span>
            <span className="text-text-1 font-mono text-sm font-semibold">{result.status}</span>
            <span
              className={`ml-auto text-sm font-semibold ${passCount === total ? 'text-primary' : 'text-system-red'}`}
            >
              {passCount}/{total} 통과
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {result.checks.map((c, i) => (
              <li
                key={i}
                className="border-line-2 bg-bg-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span className={c.pass ? 'text-primary' : 'text-system-red'}>
                  {c.pass ? '통과' : '실패'}
                </span>
                <span className="text-text-1 font-mono text-xs">{c.label}</span>
                <span className="text-text-3 ml-auto font-mono text-xs">실제: {c.actual}</span>
              </li>
            ))}
          </ul>

          <pre className="border-line-2 bg-bg-1 text-text-2 mt-3 max-h-72 overflow-auto rounded-xl border p-4 font-mono text-xs">
            {result.bodyText}
          </pre>
        </div>
      )}
    </section>
  );
};
