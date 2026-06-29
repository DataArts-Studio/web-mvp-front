'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';
import {
  type ApiAttemptForGrade,
  type HiddenGradeResult,
  gradeApiAttempts,
} from '@/shared/challenges/api-hidden-grader';
import type { ApiEndpoint, ApiSchemaField, ApiSchemaType } from '@/shared/challenges/registry';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="border-line-2 bg-bg-1 text-text-3 flex h-[180px] items-center justify-center rounded-xl border text-sm">
      에디터를 불러오는 중...
    </div>
  ),
});

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type AssertKind = 'status' | 'json' | 'exists' | 'type' | 'arrayLength';
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
interface PmResult {
  name: string;
  pass: boolean;
  error?: string;
}
interface RunResult {
  status: number;
  bodyText: string;
  checks: Check[];
  scriptResults: PmResult[];
  hiddenGrade: HiddenGradeResult;
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const SCHEMA_TYPES: ApiSchemaType[] = ['string', 'number', 'boolean', 'array', 'object', 'null'];

/** 점(.) 경로로 JSON 값 탐색. eval 없이 구조적 접근만 한다. (`data.0.id` 등) */
function getByPath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function getJsonType(value: unknown): ApiSchemaType | 'undefined' {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as ApiSchemaType;
}

/** 포스트맨 pm.expect 의 chai 유사 단언 (필요한 부분만). 실패 시 throw. */
interface Expectation {
  eql: (exp: unknown) => Expectation;
  equal: (exp: unknown) => Expectation;
  above: (n: number) => Expectation;
  below: (n: number) => Expectation;
  include: (x: unknown) => Expectation;
  lengthOf: (n: number) => Expectation;
  property: (k: string) => Expectation;
  a: (t: string) => Expectation;
  to: Expectation;
  be: Expectation;
  have: Expectation;
  that: Expectation;
}

function makeExpect(actual: unknown): Expectation {
  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  const exp: Expectation = {
    eql: (e) =>
      JSON.stringify(actual) === JSON.stringify(e)
        ? exp
        : fail(`expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(e)}`),
    equal: (e) =>
      actual === e ? exp : fail(`expected ${JSON.stringify(actual)} to equal ${JSON.stringify(e)}`),
    above: (n) =>
      typeof actual === 'number' && actual > n
        ? exp
        : fail(`expected ${String(actual)} to be above ${n}`),
    below: (n) =>
      typeof actual === 'number' && actual < n
        ? exp
        : fail(`expected ${String(actual)} to be below ${n}`),
    include: (x) => {
      const ok =
        typeof actual === 'string'
          ? actual.includes(String(x))
          : Array.isArray(actual)
            ? actual.includes(x)
            : false;
      return ok ? exp : fail(`expected ${JSON.stringify(actual)} to include ${JSON.stringify(x)}`);
    },
    lengthOf: (n) => {
      const len = Array.isArray(actual) || typeof actual === 'string' ? actual.length : NaN;
      return len === n ? exp : fail(`expected length ${n} but got ${String(len)}`);
    },
    property: (k) =>
      actual != null && typeof actual === 'object' && k in actual
        ? exp
        : fail(`expected object to have property ${k}`),
    a: (t) => (typeof actual === t ? exp : fail(`expected type ${t} but got ${typeof actual}`)),
    get to() {
      return exp;
    },
    get be() {
      return exp;
    },
    get have() {
      return exp;
    },
    get that() {
      return exp;
    },
  };
  return exp;
}

/**
 * 포스트맨 스타일 테스트 스크립트를 사용자 브라우저 안에서 평가한다.
 * 사용자 본인 세션에서 본인 코드를 돌리는 것이라(멀티테넌트 RCE 아님) 격리 러너가 필요 없다.
 */
function runPmScript(
  script: string,
  ctx: { status: number; json: unknown; bodyText: string }
): PmResult[] {
  const results: PmResult[] = [];
  const pm = {
    response: {
      code: ctx.status,
      json: (): unknown => {
        if (ctx.json === undefined) throw new Error('응답이 JSON 형식이 아닙니다.');
        return ctx.json;
      },
      text: (): string => ctx.bodyText,
      to: {
        have: {
          status: (n: number): void => {
            if (ctx.status !== n) throw new Error(`expected status ${n} but got ${ctx.status}`);
          },
        },
      },
    },
    expect: makeExpect,
    test: (name: string, fn: () => void): void => {
      try {
        fn();
        results.push({ name, pass: true });
      } catch (e) {
        results.push({ name, pass: false, error: e instanceof Error ? e.message : String(e) });
      }
    },
  };
  try {
    new Function('pm', script)(pm);
  } catch (e) {
    results.push({
      name: '스크립트 실행',
      pass: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
  return results;
}

const DEFAULT_SCRIPT = `// Postman 스타일 테스트 스크립트 (선택)
// 응답을 받은 뒤 pm.test 로 검증합니다.
pm.test('상태 코드는 200', () => {
  pm.response.to.have.status(200);
});

// TODO: 응답 JSON 도 검증해 보세요. 예:
// pm.test('상품 총 개수', () => {
//   pm.expect(pm.response.json().total).to.eql(12);
// });
`;

function parseHeaderInput(input: string): Record<string, string> {
  const trimmed = input.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('추가 헤더 JSON은 객체여야 합니다.');
    }
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
  }

  return Object.fromEntries(
    trimmed.split('\n').map((line) => {
      const separator = line.indexOf(':');
      if (separator <= 0) throw new Error('추가 헤더는 "이름: 값" 형식이어야 합니다.');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    })
  );
}
const SENSITIVE_HEADER_NAME = /^(authorization|cookie|set-cookie|x-api-key|x-qaground-signature)$/i;

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADER_NAME.test(key) ? '[REDACTED]' : value,
    ])
  );
}

function defaultValueForSchemaType(type: ApiSchemaType): unknown {
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  if (type === 'array') return [];
  if (type === 'object') return {};
  if (type === 'null') return null;
  return '';
}

function SchemaFieldList({ title, fields }: { title: string; fields?: ApiSchemaField[] }) {
  if (!fields?.length) return null;

  return (
    <div className="mt-3">
      <span className="text-text-3 text-xs font-medium">{title}</span>
      <div className="border-line-2 mt-1 overflow-hidden rounded-lg border">
        <div className="border-line-2 bg-bg-2 text-text-3 hidden grid-cols-[minmax(7rem,1.2fr)_5rem_4rem_minmax(0,1.5fr)] gap-2 border-b px-3 py-2 text-[11px] font-medium sm:grid">
          <span>필드</span>
          <span>타입</span>
          <span>필수</span>
          <span>설명</span>
        </div>
        {fields.map((field) => (
          <div
            key={`${field.path}-${field.type}`}
            className="border-line-2 grid gap-2 border-b px-3 py-2 text-xs last:border-b-0 sm:grid-cols-[minmax(7rem,1.2fr)_5rem_4rem_minmax(0,1.5fr)] sm:items-center"
          >
            <code className="text-text-1 min-w-0 font-mono break-all">{field.path}</code>
            <span className="text-text-2 font-mono">{field.type}</span>
            <span className={field.required ? 'text-primary' : 'text-text-3'}>
              {field.required ? '필수' : '선택'}
            </span>
            <span className="text-text-3 min-w-0">{field.desc ?? '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiDocsPanel({
  apiBase,
  endpoints,
  onSelectEndpoint,
}: {
  apiBase: string;
  endpoints: ApiEndpoint[];
  onSelectEndpoint: (endpoint: ApiEndpoint) => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div>
        <span className="text-text-2 text-sm font-medium">API 문서</span>
        <p className="text-text-3 mt-1 text-xs leading-relaxed">
          엔드포인트, 인증 조건, 요청 스키마, 응답 예시를 확인하고 테스터에 바로 적용합니다.
        </p>
      </div>

      {endpoints.map((endpoint) => (
        <div
          key={`${endpoint.method} ${endpoint.path}`}
          className="border-line-2 bg-bg-3 rounded-xl border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono text-xs font-semibold">
                  {endpoint.method}
                </span>
                <code className="text-text-1 font-mono text-xs break-all">
                  {apiBase}
                  {endpoint.path}
                </code>
              </div>
              <p className="text-text-3 mt-1 text-xs">{endpoint.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectEndpoint(endpoint)}
              className="border-line-2 hover:bg-bg-2 rounded-button border px-3 py-1.5 text-xs transition-colors"
            >
              요청에 적용
            </button>
          </div>

          <div className="mt-3 text-xs">
            <span className="text-text-3 font-medium">인증</span>
            <p className="text-text-2 mt-1">{endpoint.auth ? 'Bearer 토큰 필요' : '불필요'}</p>
          </div>

          <SchemaFieldList title="쿼리 파라미터" fields={endpoint.query} />
          <SchemaFieldList title="요청 본문" fields={endpoint.body} />
          <SchemaFieldList title="응답 스키마" fields={endpoint.response} />

          {endpoint.responseExample !== undefined && (
            <pre className="border-line-2 bg-bg-1 text-text-2 mt-3 max-h-48 overflow-auto rounded-lg border p-3 font-mono text-xs">
              {JSON.stringify(endpoint.responseExample, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
let nextId = 2;

/**
 * 인앱 API 테스터 + 자동 채점 (API 트랙).
 *
 * 포스트맨처럼 요청을 구성하고, (1) 구조화된 단언 또는 (2) pm.test 스크립트로 응답을 검증한다.
 * 스크립트는 사용자 브라우저에서만 평가하므로 격리 러너·서버 코드 실행이 필요 없다.
 */
export const ApiTesterExercise = ({
  apiBase,
  slug,
  endpoints,
}: {
  apiBase: string;
  slug: string;
  endpoints: ApiEndpoint[];
}) => {
  const [method, setMethod] = useState<Method>('GET');
  const [path, setPath] = useState('/products?page=1&limit=5');
  const [token, setToken] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [body, setBody] = useState('');
  const [assertions, setAssertions] = useState<Assertion[]>([
    { id: 1, kind: 'status', path: '', expected: '200' },
  ]);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [attempts, setAttempts] = useState<ApiAttemptForGrade[]>([]);
  const [activeTab, setActiveTab] = useState<'tester' | 'docs'>('tester');

  const updateAssertion = (id: number, patch: Partial<Assertion>) =>
    setAssertions((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const addAssertion = (kind: AssertKind = 'json') =>
    setAssertions((as) => [
      ...as,
      {
        id: nextId++,
        kind,
        path: '',
        expected: kind === 'type' ? 'string' : kind === 'arrayLength' ? '0' : '',
      },
    ]);
  const removeAssertion = (id: number) => setAssertions((as) => as.filter((a) => a.id !== id));

  const applyEndpoint = (endpoint: ApiEndpoint) => {
    setMethod(endpoint.method);
    setPath(endpoint.path);
    if (endpoint.body?.length) {
      setBody(
        JSON.stringify(
          Object.fromEntries(
            endpoint.body.map((field) => [field.path, defaultValueForSchemaType(field.type)])
          ),
          null,
          2
        )
      );
    }
    setActiveTab('tester');
  };

  const run = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const headers: Record<string, string> = parseHeaderInput(customHeaders);
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
        const actualType = getJsonType(actual);

        if (a.kind === 'exists') {
          return {
            label: `${a.path || '(경로 없음)'} 필드 존재`,
            pass: actual !== undefined,
            actual: actualStr,
          };
        }

        if (a.kind === 'type') {
          return {
            label: `${a.path || '(경로 없음)'} 타입 == ${a.expected}`,
            pass: actualType === a.expected.trim(),
            actual: actualType,
          };
        }

        if (a.kind === 'arrayLength') {
          return {
            label: `${a.path || '(경로 없음)'} 배열 길이 == ${a.expected}`,
            pass: Array.isArray(actual) && actual.length === Number(a.expected.trim()),
            actual: Array.isArray(actual) ? String(actual.length) : actualType,
          };
        }

        return {
          label: `${a.path || '(경로 없음)'} == ${a.expected}`,
          pass: actual !== undefined && String(actual) === a.expected.trim(),
          actual: actualStr,
        };
      });

      const scriptResults = script.trim()
        ? runPmScript(script, { status: res.status, json, bodyText })
        : [];

      const attempt: ApiAttemptForGrade = {
        method,
        path,
        status: res.status,
        assertions,
        script,
        checks,
        scriptResults,
      };
      const nextAttempts = [...attempts, attempt];
      const hiddenGrade = gradeApiAttempts(nextAttempts, { targets: endpoints });
      setAttempts(nextAttempts);

      const pretty = json !== undefined ? JSON.stringify(json, null, 2) : bodyText;
      setResult({ status: res.status, bodyText: pretty, checks, scriptResults, hiddenGrade });
      const passed =
        checks.filter((c) => c.pass).length + scriptResults.filter((r) => r.pass).length;
      const totalChecks = checks.length + scriptResults.length;
      track('api_run', { passed, total: totalChecks, score: hiddenGrade.score });
      recordSubmission({
        slug,
        kind: 'api',
        content: {
          method,
          path,
          headers: redactHeaders(headers),
          assertions,
          script,
          attempts: nextAttempts,
        },
        result: { passed, total: totalChecks },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청 실패');
    } finally {
      setRunning(false);
    }
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary border px-3 text-sm transition-colors outline-none';
  const passCount =
    (result?.checks.filter((c) => c.pass).length ?? 0) +
    (result?.scriptResults.filter((r) => r.pass).length ?? 0);
  const total = (result?.checks.length ?? 0) + (result?.scriptResults.length ?? 0);

  return (
    <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
      <h2 className="text-base font-semibold">API 테스터 자동 채점</h2>
      <p className="text-text-2 mt-2 text-sm leading-relaxed">
        요청을 구성하고, 구조화된 단언이나 포스트맨 스타일{' '}
        <code className="font-mono">pm.test</code> 스크립트로 응답을 검증해 채점합니다.
      </p>

      {!!endpoints.length && (
        <div className="border-line-2 bg-bg-3 mt-5 inline-flex rounded-lg border p-1">
          {(['tester', 'docs'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                activeTab === tab ? 'bg-primary text-white' : 'text-text-2 hover:text-text-1'
              }`}
            >
              {tab === 'tester' ? '테스터' : 'API 문서'}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'docs' && !!endpoints.length && (
        <ApiDocsPanel apiBase={apiBase} endpoints={endpoints} onSelectEndpoint={applyEndpoint} />
      )}

      {activeTab === 'tester' && (
        <>
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
            <textarea
              data-testid="api-headers"
              value={customHeaders}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCustomHeaders(e.target.value)
              }
              rows={2}
              placeholder={'추가 헤더 (선택)\nx-qaground-signature: test-signature'}
              className={`py-2 font-mono ${fieldClass}`}
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
                    <option value="json">JSON 값</option>
                    <option value="exists">필드 존재</option>
                    <option value="type">타입</option>
                    <option value="arrayLength">배열 길이</option>
                  </select>
                  {a.kind !== 'status' && (
                    <input
                      value={a.path}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateAssertion(a.id, { path: e.target.value })
                      }
                      placeholder="경로 (예: total, data.0.name)"
                      className={`h-9 flex-1 font-mono ${fieldClass}`}
                    />
                  )}
                  {a.kind !== 'exists' && (
                    <>
                      <span className="text-text-3 text-sm">==</span>
                      {a.kind === 'type' ? (
                        <select
                          value={a.expected}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateAssertion(a.id, { expected: e.target.value })
                          }
                          className={`h-9 w-28 font-mono ${fieldClass}`}
                        >
                          {SCHEMA_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={a.expected}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateAssertion(a.id, { expected: e.target.value })
                          }
                          placeholder={a.kind === 'arrayLength' ? '길이' : '기대값'}
                          className={`h-9 w-28 font-mono ${fieldClass}`}
                        />
                      )}
                    </>
                  )}
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
              onClick={() => addAssertion()}
              className="text-text-2 hover:text-text-1 mt-2 text-sm transition-colors"
            >
              + JSON 값 검증 추가
            </button>
            <button
              type="button"
              onClick={() => addAssertion('exists')}
              className="text-text-2 hover:text-text-1 mt-2 ml-3 text-sm transition-colors"
            >
              + 필드 존재
            </button>
            <button
              type="button"
              onClick={() => addAssertion('type')}
              className="text-text-2 hover:text-text-1 mt-2 ml-3 text-sm transition-colors"
            >
              + 타입
            </button>
            <button
              type="button"
              onClick={() => addAssertion('arrayLength')}
              className="text-text-2 hover:text-text-1 mt-2 ml-3 text-sm transition-colors"
            >
              + 배열 길이
            </button>
          </div>

          {/* 테스트 스크립트 (Postman 스타일) */}
          <div className="mt-6">
            <span className="text-text-2 text-sm font-medium">
              테스트 스크립트 (Postman 스타일, 선택)
            </span>
            <p className="text-text-3 mt-1 text-xs leading-relaxed">
              <code className="font-mono">pm.response</code>,{' '}
              <code className="font-mono">pm.expect</code>,{' '}
              <code className="font-mono">pm.test</code> 로 응답을 검증합니다. 비워 두면 단언만
              채점합니다.
            </p>
            <div className="border-line-2 mt-2 overflow-hidden rounded-xl border">
              <MonacoEditor
                height="180px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={script}
                onChange={(value) => setScript(value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'off',
                  padding: { top: 10, bottom: 10 },
                }}
              />
            </div>
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

              <div className="border-line-2 bg-bg-3 mt-4 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-1 text-sm font-semibold">숨김 채점</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      result.hiddenGrade.score === result.hiddenGrade.maxScore
                        ? 'text-primary'
                        : 'text-text-1'
                    }`}
                  >
                    {result.hiddenGrade.score}/{result.hiddenGrade.maxScore}점
                  </span>
                </div>
                <p className="text-text-3 mt-1 text-xs">
                  숨김 케이스 {result.hiddenGrade.passed}/{result.hiddenGrade.total} 통과
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {result.hiddenGrade.cases.map((item, index) => (
                    <span
                      key={item.id}
                      className={`border-line-2 rounded-lg border px-2 py-1 text-center text-xs font-medium ${
                        item.pass ? 'text-primary' : 'text-text-3'
                      }`}
                    >
                      #{index + 1} {item.pass ? '통과' : '실패'}
                    </span>
                  ))}
                </div>
              </div>

              {result.checks.length > 0 && (
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
                      <span className="text-text-3 ml-auto font-mono text-xs">
                        실제: {c.actual}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {result.scriptResults.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {result.scriptResults.map((r, i) => (
                    <li
                      key={i}
                      className="border-line-2 bg-bg-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className={r.pass ? 'text-primary' : 'text-system-red'}>
                        {r.pass ? '통과' : '실패'}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-text-1 text-xs">{r.name}</span>
                        {r.error && (
                          <span className="text-system-red font-mono text-xs">{r.error}</span>
                        )}
                      </span>
                      <span className="text-text-3 ml-auto font-mono text-xs">pm.test</span>
                    </li>
                  ))}
                </ul>
              )}

              <pre className="border-line-2 bg-bg-1 text-text-2 mt-3 max-h-72 overflow-auto rounded-xl border p-4 font-mono text-xs">
                {result.bodyText}
              </pre>
            </div>
          )}
        </>
      )}
    </section>
  );
};
