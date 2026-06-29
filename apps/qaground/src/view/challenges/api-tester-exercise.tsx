'use client';

import { type ReactNode, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { recordSubmission } from '@/shared/analytics/record-submission';
import { track } from '@/shared/analytics/track';
import {
  type ApiAttemptForGrade,
  type HiddenGradeResult,
  gradeApiAttempts,
} from '@/shared/challenges/api-hidden-grader';
import type { ApiEndpoint, ApiSchemaField, ApiSchemaType } from '@/shared/challenges/registry';
import { Play, Plus, Send, Trash2 } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="border-line-2 bg-bg-1 text-text-3 flex h-[180px] items-center justify-center border text-sm">
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
const METHOD_TONE: Record<Method, string> = {
  GET: 'text-primary bg-primary/10 border-primary/20',
  POST: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  PUT: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  PATCH: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  DELETE: 'text-system-red bg-system-red/10 border-system-red/20',
};
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

function endpointKey(endpoint: ApiEndpoint): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function SchemaFieldList({ title, fields }: { title: string; fields?: ApiSchemaField[] }) {
  if (!fields?.length) return null;

  return (
    <div className="mt-3">
      <span className="text-text-3 text-xs font-medium">{title}</span>
      <div className="border-line-2 mt-1 overflow-hidden border">
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

function DocsSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="border-line-2 bg-bg-2 border" open={defaultOpen}>
      <summary className="text-text-2 hover:bg-bg-1 cursor-pointer px-3 py-2 text-xs font-medium transition-colors">
        {title}
      </summary>
      <div className="border-line-2 border-t p-3">{children}</div>
    </details>
  );
}

function HeaderDoc({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="border-line-2 overflow-hidden border text-xs">
      <div className="border-line-2 bg-bg-2 text-text-3 grid grid-cols-[minmax(8rem,1fr)_minmax(9rem,1fr)_minmax(0,1.5fr)] gap-2 border-b px-3 py-2 font-medium">
        <span>헤더</span>
        <span>값</span>
        <span>설명</span>
      </div>
      <div className="border-line-2 grid grid-cols-[minmax(8rem,1fr)_minmax(9rem,1fr)_minmax(0,1.5fr)] gap-2 border-b px-3 py-2 last:border-b-0">
        <code className="text-text-1 font-mono">Content-Type</code>
        <code className="text-text-2 font-mono">application/json</code>
        <span className="text-text-3">본문이 있는 요청에서 사용합니다.</span>
      </div>
      {endpoint.auth && (
        <div className="grid grid-cols-[minmax(8rem,1fr)_minmax(9rem,1fr)_minmax(0,1.5fr)] gap-2 px-3 py-2">
          <code className="text-text-1 font-mono">Authorization</code>
          <code className="text-text-2 font-mono">Bearer &lt;token&gt;</code>
          <span className="text-text-3">보호된 API 요청에 필요합니다.</span>
        </div>
      )}
    </div>
  );
}

function EmptyDoc({ label }: { label: string }) {
  return <p className="text-text-3 text-xs">{label}이 없습니다.</p>;
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
    <div className="flex flex-col gap-3">
      <div className="border-line-2 bg-bg-3 border px-4 py-3">
        <span className="text-text-2 text-sm font-medium">API 문서</span>
        <p className="text-text-3 mt-1 text-xs leading-relaxed">
          엔드포인트별 요청 헤더, 쿼리, 본문, 응답 스키마와 예시를 펼쳐서 확인합니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {endpoints.map((endpoint, index) => (
          <details
            key={`${endpoint.method} ${endpoint.path}`}
            className="border-line-2 bg-bg-3 border"
            open={index === 0}
          >
            <summary className="hover:bg-bg-2 cursor-pointer px-4 py-3 transition-colors">
              <div className="inline-flex min-w-0 flex-wrap items-center gap-2 align-middle">
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${METHOD_TONE[endpoint.method]}`}
                >
                  {endpoint.method}
                </span>
                <code className="text-text-1 font-mono text-xs break-all">
                  {apiBase}
                  {endpoint.path}
                </code>
                {endpoint.auth && <span className="text-text-3 text-xs">인증 필요</span>}
              </div>
              <p className="text-text-3 mt-1 text-xs">{endpoint.desc}</p>
            </summary>

            <div className="border-line-2 flex flex-col gap-3 border-t p-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectEndpoint(endpoint)}
                  className="border-line-2 hover:bg-bg-2 border px-3 py-1.5 text-xs transition-colors"
                >
                  요청에 적용
                </button>
              </div>

              <DocsSection title="요청 헤더" defaultOpen>
                <HeaderDoc endpoint={endpoint} />
              </DocsSection>

              <DocsSection title="쿼리 파라미터" defaultOpen={!!endpoint.query?.length}>
                {endpoint.query?.length ? (
                  <SchemaFieldList title="쿼리 파라미터" fields={endpoint.query} />
                ) : (
                  <EmptyDoc label="쿼리 파라미터" />
                )}
              </DocsSection>

              <DocsSection title="요청 본문" defaultOpen={!!endpoint.body?.length}>
                {endpoint.body?.length ? (
                  <SchemaFieldList title="요청 본문" fields={endpoint.body} />
                ) : (
                  <EmptyDoc label="요청 본문" />
                )}
              </DocsSection>

              <DocsSection title="응답 스키마" defaultOpen={!!endpoint.response?.length}>
                {endpoint.response?.length ? (
                  <SchemaFieldList title="응답 스키마" fields={endpoint.response} />
                ) : (
                  <EmptyDoc label="응답 스키마" />
                )}
              </DocsSection>

              <DocsSection title="응답 예시" defaultOpen={endpoint.responseExample !== undefined}>
                {endpoint.responseExample !== undefined ? (
                  <pre className="border-line-2 bg-bg-1 text-text-2 max-h-72 overflow-auto border p-3 font-mono text-xs">
                    {JSON.stringify(endpoint.responseExample, null, 2)}
                  </pre>
                ) : (
                  <EmptyDoc label="응답 예시" />
                )}
              </DocsSection>
            </div>
          </details>
        ))}
      </div>
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
  const [method, setMethod] = useState<Method>(endpoints[0]?.method ?? 'GET');
  const [path, setPath] = useState(endpoints[0]?.path ?? '/products?page=1&limit=5');
  const [selectedEndpointKey, setSelectedEndpointKey] = useState(
    endpoints[0] ? endpointKey(endpoints[0]) : ''
  );
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
  const [activePanel, setActivePanel] = useState<'test' | 'docs' | 'script'>('test');
  const [resultH, setResultH] = useState(288);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

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
    setSelectedEndpointKey(endpointKey(endpoint));
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

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: resultH };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const next = dragRef.current.startH + (dragRef.current.startY - e.clientY);
    setResultH(Math.min(Math.max(next, 120), 520));
  };
  const onResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 포인터 캡처가 없으면 무시
    }
  };
  const fieldClass =
    'border-line-3 bg-bg-3 text-text-1 placeholder:text-text-3 focus:border-primary border px-3 text-sm transition-colors outline-none';
  const passCount =
    (result?.checks.filter((c) => c.pass).length ?? 0) +
    (result?.scriptResults.filter((r) => r.pass).length ?? 0);
  const total = (result?.checks.length ?? 0) + (result?.scriptResults.length ?? 0);

  return (
    <section className="border-line-2 bg-bg-2 flex h-full min-h-0 flex-col overflow-hidden border-0 lg:border-l">
      <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-bg-3 border-line-2 flex size-8 shrink-0 items-center justify-center border">
            <Send className="text-primary size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-text-1 text-sm font-semibold">API 테스트 워크벤치</h2>
            <div className="text-text-3 mt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <span>{endpoints.length}개 엔드포인트</span>
              <span>·</span>
              <span>{attempts.length}회 실행</span>
            </div>
          </div>
        </div>
        <div className="border-line-2 bg-bg-3 flex border text-sm">
          {(
            [
              ['test', 'API 테스트'],
              ['docs', '문서'],
              ['script', '스크립트 작성'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActivePanel(key)}
              className={`border-line-2 border-r px-3 py-1.5 text-xs transition-colors last:border-r-0 ${
                activePanel === key ? 'bg-bg-1 text-text-1' : 'text-text-3 hover:text-text-1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          data-testid="api-run"
          type="button"
          onClick={run}
          disabled={running}
          className="bg-primary hover:bg-primary/90 active:bg-primary/80 inline-flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium text-white transition-colors disabled:opacity-60"
        >
          <Play className="size-4" aria-hidden="true" />
          {running ? '실행 중' : '실행'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activePanel === 'test' && (
          <div className="p-4 sm:p-5">
            {!!endpoints.length && (
              <div className="border-line-2 mb-4 flex gap-2 overflow-x-auto border-b pb-3">
                {endpoints.map((endpoint) => {
                  const isActive = endpointKey(endpoint) === selectedEndpointKey;
                  return (
                    <button
                      key={endpointKey(endpoint)}
                      type="button"
                      onClick={() => applyEndpoint(endpoint)}
                      className={`border-line-2 shrink-0 border px-3 py-2 text-left transition-colors ${
                        isActive ? 'bg-bg-1' : 'bg-bg-3 hover:bg-bg-1'
                      }`}
                    >
                      <span
                        className={`inline-flex border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${METHOD_TONE[endpoint.method]}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-text-1 mt-1 block max-w-52 truncate font-mono text-xs">
                        {endpoint.path}
                      </code>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
              <select
                data-testid="api-method"
                value={method}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setMethod(e.target.value as Method)
                }
                className={`h-button-md ${fieldClass}`}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="border-line-3 bg-bg-3 focus-within:border-primary grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center border transition-colors">
                <span className="text-text-3 border-line-2 h-full border-r px-3 py-2.5 font-mono text-xs">
                  {apiBase}
                </span>
                <input
                  data-testid="api-path"
                  value={path}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
                  placeholder="/products?page=1&limit=5"
                  className="text-text-1 placeholder:text-text-3 min-w-0 bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="border-line-2 bg-bg-3 hover:bg-bg-1 border px-4 text-sm font-medium transition-colors disabled:opacity-60"
              >
                Send
              </button>
            </div>

            {error && (
              <p className="text-system-red mt-3 text-sm" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-text-2 text-sm font-medium">토큰</span>
                <input
                  data-testid="api-token"
                  value={token}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                  placeholder="qaground-demo-token"
                  className={`h-button-md ${fieldClass}`}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-text-2 text-sm font-medium">추가 헤더</span>
                <input
                  data-testid="api-headers"
                  value={customHeaders}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomHeaders(e.target.value)
                  }
                  placeholder="x-qaground-signature: test-signature"
                  className={`h-button-md font-mono ${fieldClass}`}
                />
              </label>
            </div>

            {method !== 'GET' && (
              <label className="mt-4 flex min-w-0 flex-col gap-2">
                <span className="text-text-2 text-sm font-medium">본문</span>
                <textarea
                  data-testid="api-body"
                  value={body}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                  rows={5}
                  placeholder={'{ "name": "테스트 상품", "price": 1000 }'}
                  className={`resize-none py-2 font-mono ${fieldClass}`}
                />
              </label>
            )}

            <div className="border-line-2 mt-6 border-t pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-text-1 text-sm font-semibold">검증 조건</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addAssertion()}
                    className="border-line-2 bg-bg-3 hover:bg-bg-1 inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => addAssertion('exists')}
                    className="border-line-2 bg-bg-3 hover:bg-bg-1 inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> 존재
                  </button>
                  <button
                    type="button"
                    onClick={() => addAssertion('type')}
                    className="border-line-2 bg-bg-3 hover:bg-bg-1 inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> 타입
                  </button>
                  <button
                    type="button"
                    onClick={() => addAssertion('arrayLength')}
                    className="border-line-2 bg-bg-3 hover:bg-bg-1 inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> 길이
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {assertions.map((a) => (
                  <div
                    key={a.id}
                    className="border-line-2 bg-bg-3 grid gap-2 border p-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <select
                      value={a.kind}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateAssertion(a.id, { kind: e.target.value as AssertKind })
                      }
                      className={`h-9 ${fieldClass}`}
                    >
                      <option value="status">상태 코드</option>
                      <option value="json">JSON 값</option>
                      <option value="exists">필드 존재</option>
                      <option value="type">타입</option>
                      <option value="arrayLength">배열 길이</option>
                    </select>
                    {a.kind !== 'status' ? (
                      <input
                        value={a.path}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateAssertion(a.id, { path: e.target.value })
                        }
                        placeholder="total, data.0.name"
                        className={`h-9 min-w-0 font-mono ${fieldClass}`}
                      />
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                    {a.kind !== 'exists' &&
                      (a.kind === 'type' ? (
                        <select
                          value={a.expected}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateAssertion(a.id, { expected: e.target.value })
                          }
                          className={`h-9 w-full font-mono sm:w-28 ${fieldClass}`}
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
                          className={`h-9 w-full font-mono sm:w-28 ${fieldClass}`}
                        />
                      ))}
                    <button
                      type="button"
                      onClick={() => removeAssertion(a.id)}
                      className="text-text-3 hover:text-system-red flex size-9 items-center justify-center transition-colors"
                      aria-label="단언 삭제"
                      title="단언 삭제"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'docs' && (
          <div className="p-4 sm:p-5">
            <ApiDocsPanel
              apiBase={apiBase}
              endpoints={endpoints}
              onSelectEndpoint={applyEndpoint}
            />
          </div>
        )}

        {activePanel === 'script' && (
          <div className="flex h-full min-h-[420px] flex-col">
            <div className="border-line-2 bg-bg-3 border-b px-4 py-2 text-sm font-semibold">
              테스트 스크립트
            </div>
            <div className="min-h-0 flex-1">
              <MonacoEditor
                height="100%"
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
                  padding: { top: 10, bottom: 10 },
                  fixedOverflowWidgets: true,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="API 결과 높이 조절"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="border-line-2 bg-bg-2 hover:bg-primary/20 group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center border-t transition-colors"
      >
        <span
          aria-hidden
          className="bg-line-3 group-hover:bg-primary h-0.5 w-8 transition-colors"
        />
      </div>
      <div
        data-testid="api-result"
        style={{ height: resultH }}
        className="flex shrink-0 flex-col overflow-hidden bg-[#0d1117]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2">
          <span className="font-mono text-xs text-[#8b949e]">api result</span>
          {result && <span className="font-mono text-xs text-[#c9d1d9]">HTTP {result.status}</span>}
          {result && (
            <span
              className={`ml-auto font-mono text-xs ${passCount === total ? 'text-[#3fb950]' : 'text-[#f85149]'}`}
            >
              {passCount}/{total} passed
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-[#c9d1d9]">
          {!result ? (
            <span className="text-[#8b949e]">실행하면 응답과 채점 결과가 여기에 표시됩니다.</span>
          ) : (
            <>
              <div className="text-[#8b949e]">
                hidden grade {result.hiddenGrade.score}/{result.hiddenGrade.maxScore}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-5">
                {result.hiddenGrade.cases.map((item, index) => (
                  <span key={item.id} className={item.pass ? 'text-[#3fb950]' : 'text-[#8b949e]'}>
                    #{index + 1} {item.pass ? 'pass' : 'fail'}
                  </span>
                ))}
              </div>
              {(result.checks.length > 0 || result.scriptResults.length > 0) && (
                <div className="mt-3 space-y-1">
                  {result.checks.map((c, i) => (
                    <div key={i} className={c.pass ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                      {c.pass ? '✓' : '✗'} {c.label} · actual: {c.actual}
                    </div>
                  ))}
                  {result.scriptResults.map((r, i) => (
                    <div
                      key={`script-${i}`}
                      className={r.pass ? 'text-[#3fb950]' : 'text-[#f85149]'}
                    >
                      {r.pass ? '✓' : '✗'} {r.name}
                      {r.error ? ` · ${r.error}` : ''}
                    </div>
                  ))}
                </div>
              )}
              <pre className="mt-4 whitespace-pre-wrap text-[#c9d1d9]">{result.bodyText}</pre>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
