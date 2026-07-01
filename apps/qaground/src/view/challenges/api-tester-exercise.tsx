'use client';

import { type ReactNode, useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics/track';
import {
  type ApiAttemptForGrade,
  type HiddenGradeResult,
  gradeApiAttempts,
} from '@/shared/challenges/api-hidden-grader';
import type { ApiEndpoint, ApiSchemaField, ApiSchemaType } from '@/shared/challenges/registry';
import { DsCheckbox } from '@testea/ui';
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
type ResultTab = 'body' | 'checks' | 'script' | 'headers' | 'grade';
type AuthKind = 'none' | 'bearer' | 'basic' | 'apiKey';
type HeaderKey =
  | 'Accept'
  | 'Content-Type'
  | 'Authorization'
  | 'x-api-key'
  | 'x-qaground-signature'
  | 'x-request-id';
interface HeaderRow {
  id: number;
  key: HeaderKey;
  value: string;
  enabled: boolean;
}
interface Assertion {
  id: number;
  kind: AssertKind;
  path: string;
  expected: string;
}
interface ApiRequestCase {
  key: string;
  label: string;
  endpoint: ApiEndpoint;
  method: Method;
  path: string;
  expectedStatus: string;
  authType?: AuthKind;
  body?: string;
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
  durationMs: number;
  responseHeaders: Record<string, string>;
  bodyText: string;
  checks: Check[];
  scriptResults: PmResult[];
  declaredScriptCount: number;
  hiddenGrade: HiddenGradeResult;
}
interface RequestHistoryItem {
  id: string;
  method: Method;
  path: string;
  status: number;
  durationMs: number;
  passed: number;
  total: number;
  createdAt: string;
}

type ApiTermKind = 'cmd' | 'dim' | 'pass' | 'fail' | 'run';
interface ApiTermLine {
  id: string;
  text: string;
  kind: ApiTermKind;
}

const API_TERM_CLASS: Record<ApiTermKind, string> = {
  cmd: 'text-[#c9d1d9]',
  dim: 'text-[#8b949e]',
  pass: 'text-[#3fb950]',
  fail: 'text-[#f85149]',
  run: 'text-[#d29922]',
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
function shouldSendProductionTelemetry(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'qaground.gettestea.com';
}

function getAnonId(): string {
  try {
    let id = window.localStorage.getItem('qaground_anon_id');
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem('qaground_anon_id', id);
    }
    return id;
  } catch {
    return '';
  }
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
const AUTH_TYPES: { key: AuthKind; label: string; placeholder: string }[] = [
  { key: 'none', label: 'No Auth', placeholder: '토큰 없음' },
  { key: 'bearer', label: 'Bearer Token', placeholder: 'qaground-demo-token' },
  { key: 'basic', label: 'Basic Auth', placeholder: 'username:password' },
  { key: 'apiKey', label: 'API Key', placeholder: 'api key value' },
];
const HEADER_KEYS: HeaderKey[] = [
  'Accept',
  'Content-Type',
  'Authorization',
  'x-api-key',
  'x-qaground-signature',
  'x-request-id',
];
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
    a: (t) => {
      const actualType = Array.isArray(actual) ? 'array' : typeof actual;
      return actualType === t ? exp : fail(`expected type ${t} but got ${actualType}`);
    },
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

function defaultAssertionsForCase(requestCase?: ApiRequestCase): Assertion[] {
  return [
    { id: nextId++, kind: 'status', path: '', expected: requestCase?.expectedStatus ?? '200' },
  ];
}

function defaultScriptForCase(requestCase?: ApiRequestCase): string {
  const expected = requestCase?.expectedStatus ?? '200';
  const title = requestCase ? `${requestCase.method} ${requestCase.path}` : 'API 요청';
  if (expected === '204') {
    return `// ${title} 검증

pm.test('상태 코드는 ${expected}', () => {
  pm.response.to.have.status(${expected});
});
`;
  }
  if (expected === '404') {
    return `// ${title} 검증
const json = pm.response.json();

pm.test('상태 코드는 404', () => {
  pm.response.to.have.status(404);
});

pm.test('에러 메시지를 반환한다', () => {
  pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
});
`;
  }
  return `// ${title} 검증
const json = pm.response.json();

pm.test('상태 코드는 ${expected}', () => {
  pm.response.to.have.status(${expected});
});
`;
}
function countDeclaredPmTests(script: string): number {
  return stripNonExecutableScriptText(script).match(/pm\.test\s*\(/g)?.length ?? 0;
}

function stripNonExecutableScriptText(script: string): string {
  let output = '';
  let quote: 'single' | 'double' | 'template' | null = null;
  let escaped = false;

  for (let i = 0; i < script.length; i += 1) {
    const current = script[i];
    const next = script[i + 1];

    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (
        (quote === 'single' && current === "'") ||
        (quote === 'double' && current === '"') ||
        (quote === 'template' && current === '`')
      ) {
        quote = null;
      }
      output += current === '\n' ? '\n' : ' ';
      continue;
    }

    if (current === "'") {
      quote = 'single';
      output += ' ';
      continue;
    }
    if (current === '"') {
      quote = 'double';
      output += ' ';
      continue;
    }
    if (current === '`') {
      quote = 'template';
      output += ' ';
      continue;
    }
    if (current === '/' && next === '/') {
      while (i < script.length && script[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }
    if (current === '/' && next === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) {
        output += script[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      i += 1;
      continue;
    }

    output += current;
  }

  return output;
}
function headersFromRows(rows: HeaderRow[]): Record<string, string> {
  return Object.fromEntries(
    rows.filter((row) => row.enabled && row.value.trim()).map((row) => [row.key, row.value.trim()])
  );
}

function applyAuthHeader(headers: Record<string, string>, authType: AuthKind, token: string): void {
  const trimmed = token.trim();
  if (!trimmed || authType === 'none') return;
  if (authType === 'bearer') headers.Authorization = `Bearer ${trimmed}`;
  if (authType === 'basic') headers.Authorization = `Basic ${btoa(trimmed)}`;
  if (authType === 'apiKey') headers['x-api-key'] = trimmed;
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

function defaultExpectedForKind(kind: AssertKind) {
  if (kind === 'status') return '200';
  if (kind === 'type') return 'string';
  if (kind === 'arrayLength') return '0';
  return '';
}

function executablePathForEndpoint(path: string) {
  return path.replace(/:([A-Za-z_$][\w$]*)/g, (_, name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('id') || lower.includes('id')) return '1';
    return 'demo';
  });
}

function missingPathForEndpoint(path: string) {
  return path.replace(/:([A-Za-z_$][\w$]*)/g, (_, name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('id') || lower.includes('id')) return '9999';
    return 'missing';
  });
}

function statusFromDesc(endpoint: ApiEndpoint, fallback: string) {
  return endpoint.desc.match(/\b(200|201|204|400|401|404)\b/)?.[1] ?? fallback;
}

function requestCaseKey(endpoint: ApiEndpoint, suffix: string) {
  return `${endpointKey(endpoint)}::${suffix}`;
}

function buildRequestCases(endpoints: ApiEndpoint[]): ApiRequestCase[] {
  return endpoints.flatMap((endpoint) => {
    const method = endpoint.method as Method;
    const successStatus = method === 'POST' ? '201' : method === 'DELETE' ? '204' : '200';
    const baseBody = endpoint.body?.length
      ? JSON.stringify(
          Object.fromEntries(
            endpoint.body.map((field) => [
              field.path,
              field.example ?? defaultValueForSchemaType(field.type),
            ])
          ),
          null,
          2
        )
      : '';
    const cases: ApiRequestCase[] = [
      {
        key: requestCaseKey(endpoint, 'success'),
        label: `${method} ${executablePathForEndpoint(endpoint.path)} · 정상`,
        endpoint,
        method,
        path: executablePathForEndpoint(endpoint.path),
        expectedStatus: statusFromDesc(endpoint, successStatus),
        authType: endpoint.auth ? 'bearer' : undefined,
        body: baseBody,
      },
    ];

    if (/\b404\b/.test(endpoint.desc)) {
      cases.push({
        key: requestCaseKey(endpoint, 'not-found'),
        label: `${method} ${missingPathForEndpoint(endpoint.path)} · 404`,
        endpoint,
        method,
        path: missingPathForEndpoint(endpoint.path),
        expectedStatus: '404',
        authType: endpoint.auth ? 'bearer' : undefined,
        body: baseBody,
      });
    }
    if (endpoint.auth) {
      cases.push({
        key: requestCaseKey(endpoint, 'unauthorized'),
        label: `${method} ${executablePathForEndpoint(endpoint.path)} · 인증 없음`,
        endpoint,
        method,
        path: executablePathForEndpoint(endpoint.path),
        expectedStatus: '401',
        authType: 'none',
        body: baseBody,
      });
    }
    if (/\b400\b/.test(endpoint.desc) && endpoint.body?.length) {
      cases.push({
        key: requestCaseKey(endpoint, 'invalid-body'),
        label: `${method} ${executablePathForEndpoint(endpoint.path)} · 잘못된 본문`,
        endpoint,
        method,
        path: executablePathForEndpoint(endpoint.path),
        expectedStatus: '400',
        authType: endpoint.auth ? 'bearer' : undefined,
        body: '{}',
      });
    }

    return cases;
  });
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
let nextHeaderId = 2;

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
  mode = 'challenge',
}: {
  apiBase: string;
  slug: string;
  endpoints: ApiEndpoint[];
  mode?: 'challenge' | 'playground';
}) => {
  const router = useRouter();
  const isPlayground = mode === 'playground';
  const requestCases = buildRequestCases(endpoints);
  const [selectedCaseKey, setSelectedCaseKey] = useState(requestCases[0]?.key ?? '');
  const selectedCase = requestCases.find((item) => item.key === selectedCaseKey);
  const [method, setMethod] = useState<Method>(selectedCase?.method ?? 'GET');
  const [path, setPath] = useState(selectedCase?.path ?? '/products?page=1&limit=5');
  const [authType, setAuthType] = useState<AuthKind>(selectedCase?.authType ?? 'bearer');
  const [token, setToken] = useState('');
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([
    { id: 1, key: 'x-qaground-signature', value: '', enabled: true },
  ]);
  const [body, setBody] = useState(selectedCase?.body ?? '');
  const [assertionsByCase, setAssertionsByCase] = useState<Record<string, Assertion[]>>(() =>
    requestCases[0] ? { [requestCases[0].key]: defaultAssertionsForCase(requestCases[0]) } : {}
  );
  const [scriptsByCase, setScriptsByCase] = useState<Record<string, string>>(() =>
    requestCases[0] ? { [requestCases[0].key]: defaultScriptForCase(requestCases[0]) } : {}
  );
  const assertions = assertionsByCase[selectedCaseKey] ?? defaultAssertionsForCase(selectedCase);
  const script = scriptsByCase[selectedCaseKey] ?? defaultScriptForCase(selectedCase);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [term, setTerm] = useState<ApiTermLine[]>([]);
  const [resultTab, setResultTab] = useState<ResultTab>('body');
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [attempts, setAttempts] = useState<ApiAttemptForGrade[]>([]);
  const [activePanel, setActivePanel] = useState<'test' | 'docs' | 'script'>('test');
  const [resultH, setResultH] = useState(288);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const setCaseAssertions = (updater: (items: Assertion[]) => Assertion[]) =>
    setAssertionsByCase((prev) => {
      const current = prev[selectedCaseKey] ?? defaultAssertionsForCase(selectedCase);
      return { ...prev, [selectedCaseKey]: updater(current) };
    });
  const updateAssertion = (id: number, patch: Partial<Assertion>) =>
    setCaseAssertions((items) => items.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const addAssertion = (kind: AssertKind = 'json') =>
    setCaseAssertions((items) => [
      ...items,
      {
        id: nextId++,
        kind,
        path: '',
        expected: defaultExpectedForKind(kind),
      },
    ]);
  const removeAssertion = (id: number) =>
    setCaseAssertions((items) => items.filter((a) => a.id !== id));
  const updateHeaderRow = (id: number, patch: Partial<HeaderRow>) =>
    setHeaderRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const addHeaderRow = () =>
    setHeaderRows((rows) => [
      ...rows,
      { id: nextHeaderId++, key: 'x-request-id', value: '', enabled: true },
    ]);
  const removeHeaderRow = (id: number) =>
    setHeaderRows((rows) => rows.filter((row) => row.id !== id));

  const applyRequestCase = (requestCase: ApiRequestCase) => {
    setSelectedCaseKey(requestCase.key);
    setAssertionsByCase((prev) =>
      prev[requestCase.key]
        ? prev
        : { ...prev, [requestCase.key]: defaultAssertionsForCase(requestCase) }
    );
    setScriptsByCase((prev) =>
      prev[requestCase.key]
        ? prev
        : { ...prev, [requestCase.key]: defaultScriptForCase(requestCase) }
    );
    setMethod(requestCase.method);
    setPath(requestCase.path);
    setAuthType(requestCase.authType ?? 'bearer');
    setBody(requestCase.body ?? '');
  };

  const applyEndpoint = (endpoint: ApiEndpoint) => {
    const requestCase = requestCases.find((item) => item.endpoint === endpoint) ?? requestCases[0];
    if (requestCase) applyRequestCase(requestCase);
  };
  const run = async (shouldSubmit = false) => {
    const push = (line: ApiTermLine) => setTerm((prev) => [...prev, line]);
    setRunning(true);
    setError('');
    setResult(null);
    setResultTab('body');
    setTerm([]);
    try {
      push({
        id: 'cmd',
        text: shouldSubmit ? '$ qaground api submit' : '$ qaground api run',
        kind: 'cmd',
      });
      await delay(180);
      push({ id: 'prepare', text: '  ◌  요청 구성 중', kind: 'run' });
      const headers = headersFromRows(headerRows);
      applyAuthHeader(headers, authType, token);
      const hasBody = method !== 'GET' && body.trim();
      if (hasBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
      setTerm((prev) =>
        prev.map((line) =>
          line.id === 'prepare' ? { ...line, text: '  ✓  요청 구성 완료', kind: 'pass' } : line
        )
      );
      push({ id: 'request', text: '  ◌  ' + method + ' ' + path + ' 호출 중', kind: 'run' });

      const startedAt = performance.now();
      const res = await fetch(apiBase + path, {
        method,
        headers,
        body: hasBody ? body : undefined,
      });
      const durationMs = Math.round(performance.now() - startedAt);
      const responseHeaders = Object.fromEntries(res.headers.entries());
      setTerm((prev) =>
        prev.map((line) =>
          line.id === 'request'
            ? {
                ...line,
                text: '  ✓  HTTP ' + res.status + ' 응답 수신 (' + durationMs + 'ms)',
                kind: 'pass',
              }
            : line
        )
      );
      push({ id: 'parse', text: '  ◌  응답 본문 분석 중', kind: 'run' });

      const bodyText = await res.text();
      let json: unknown = undefined;
      try {
        json = JSON.parse(bodyText);
      } catch {
        json = undefined;
      }
      setTerm((prev) =>
        prev.map((line) =>
          line.id === 'parse' ? { ...line, text: '  ✓  응답 본문 분석 완료', kind: 'pass' } : line
        )
      );
      push({ id: 'checks', text: '  ◌  사용자 검증 실행 중', kind: 'run' });

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

      const userScript = script.trim() === DEFAULT_SCRIPT.trim() ? '' : script;
      const declaredScriptCount = userScript.trim() ? countDeclaredPmTests(userScript) : 0;
      const scriptResults = userScript.trim()
        ? runPmScript(userScript, { status: res.status, json, bodyText })
        : [];
      const checkPass =
        checks.every((check) => check.pass) && scriptResults.every((item) => item.pass);
      setTerm((prev) =>
        prev.map((line) =>
          line.id === 'checks'
            ? {
                ...line,
                text:
                  '  ' + (checkPass ? '✓' : '✗') + '  사용자 검증 ' + (checkPass ? '통과' : '실패'),
                kind: checkPass ? 'pass' : 'fail',
              }
            : line
        )
      );
      if (!isPlayground) {
        push({
          id: 'grade',
          text: shouldSubmit ? '  ◌  제출 결과 정리 중' : '  ◌  채점 결과 정리 중',
          kind: 'run',
        });
      }

      const attempt: ApiAttemptForGrade = {
        method,
        path,
        status: res.status,
        assertions,
        script: userScript,
        checks,
        scriptResults,
      };
      const nextAttempts = [...attempts, attempt];
      const hiddenGrade = gradeApiAttempts(nextAttempts, { targets: endpoints });
      setAttempts(nextAttempts);

      const pretty = json !== undefined ? JSON.stringify(json, null, 2) : bodyText;
      const passed =
        checks.filter((c) => c.pass).length + scriptResults.filter((r) => r.pass).length;
      const totalChecks = checks.length + scriptResults.length;
      const gradePassed = hiddenGrade.score === hiddenGrade.maxScore;
      if (!isPlayground) {
        setTerm((prev) =>
          prev.map((line) =>
            line.id === 'grade'
              ? {
                  ...line,
                  text:
                    '  ' +
                    (gradePassed ? '✓' : '◌') +
                    '  ' +
                    (shouldSubmit ? '제출' : '채점') +
                    ' 결과 준비 완료',
                  kind: gradePassed ? 'pass' : 'run',
                }
              : line
          )
        );
      }
      setResult({
        status: res.status,
        durationMs,
        responseHeaders,
        bodyText: pretty,
        checks,
        scriptResults,
        declaredScriptCount,
        hiddenGrade,
      });
      setResultTab('body');
      setHistory((prev) =>
        [
          {
            id: `${Date.now()}-${nextAttempts.length}`,
            method,
            path,
            status: res.status,
            durationMs,
            passed,
            total: totalChecks,
            createdAt: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          },
          ...prev,
        ].slice(0, 6)
      );
      if (!isPlayground && shouldSendProductionTelemetry()) {
        track(shouldSubmit ? 'api_submit' : 'api_run', {
          passed,
          total: totalChecks,
          score: hiddenGrade.score,
        });
      }
      if (!isPlayground && shouldSubmit) {
        const submitResponse = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            kind: 'api',
            ...(shouldSendProductionTelemetry() ? { anonId: getAnonId() } : {}),
            content: {
              method,
              path,
              headers: redactHeaders(headers),
              assertions,
              script: userScript,
              attempts: nextAttempts,
            },
            result: { passed, total: totalChecks },
          }),
        });
        const submitResult = (await submitResponse.json().catch(() => null)) as {
          ok?: boolean;
          resultToken?: string;
          error?: string;
        } | null;
        if (!submitResponse.ok || !submitResult?.resultToken) {
          push({
            id: 'submit-error',
            text: `  ✗  ${submitResult?.error ?? '제출 결과 토큰을 발급받지 못했습니다.'}`,
            kind: 'fail',
          });
          setError(submitResult?.error ?? '제출에 실패했습니다. 다시 시도해 주세요.');
          return;
        }
        router.push(
          `/challenges/${slug}/result?token=${encodeURIComponent(submitResult.resultToken)}`
        );
      }
    } catch (e) {
      push({ id: 'error', text: '  ✗  요청 실행 실패', kind: 'fail' });
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
  const resultTabs: { key: ResultTab; label: string; count?: number }[] = [
    { key: 'body', label: 'Body' },
    { key: 'checks', label: '검증', count: result?.checks.length },
    { key: 'script', label: '스크립트', count: result?.scriptResults.length },
    {
      key: 'headers',
      label: 'Headers',
      count: result ? Object.keys(result.responseHeaders).length : 0,
    },
    ...(isPlayground ? [] : ([{ key: 'grade', label: '채점' }] as const)),
  ];

  return (
    <section
      className={`border-line-2 bg-bg-2 flex h-full min-h-0 flex-col overflow-hidden border-0 ${isPlayground ? '' : 'lg:border-l'}`}
    >
      <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-bg-3 border-line-2 flex size-8 shrink-0 items-center justify-center border">
            <Send className="text-primary size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-text-1 text-sm font-semibold">
              {isPlayground ? 'API Sandbox Workbench' : 'API 테스트 워크벤치'}
            </h2>
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
          onClick={() => run(false)}
          disabled={running}
          className="bg-primary hover:bg-primary/90 active:bg-primary/80 inline-flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium text-white transition-colors disabled:opacity-60"
        >
          <Play className="size-4" aria-hidden="true" />
          {running ? '실행 중' : '실행'}
        </button>
        {!isPlayground && (
          <button
            data-testid="api-submit"
            type="button"
            onClick={() => run(true)}
            disabled={running}
            className="border-primary text-primary hover:bg-primary/10 active:bg-primary/15 inline-flex h-9 items-center justify-center gap-2 border px-4 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden="true" />
            제출
          </button>
        )}
      </div>

      <div className="qg-panel-scrollbar min-h-0 flex-1 overflow-auto">
        {activePanel === 'test' && (
          <div className="p-4 sm:p-5">
            {!!endpoints.length && (
              <label className="mb-4 grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
                <span className="text-text-2 text-sm font-medium">Endpoint</span>
                <select
                  value={selectedCaseKey}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const requestCase = requestCases.find((item) => item.key === e.target.value);
                    if (requestCase) applyRequestCase(requestCase);
                  }}
                  className={`h-button-md min-w-0 font-mono ${fieldClass}`}
                >
                  {requestCases.map((requestCase) => (
                    <option key={requestCase.key} value={requestCase.key}>
                      {requestCase.label}
                    </option>
                  ))}
                </select>
              </label>
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
                onClick={() => run(false)}
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

            {history.length > 0 && (
              <div className="border-line-2 bg-bg-3 mt-4 border">
                <div className="border-line-2 flex items-center justify-between border-b px-3 py-2">
                  <span className="text-text-2 text-xs font-semibold">최근 요청</span>
                  <span className="text-text-3 text-xs">최근 {history.length}개</span>
                </div>
                <div className="divide-line-2 divide-y">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMethod(item.method);
                        setPath(item.path);
                      }}
                      className="hover:bg-bg-1 grid w-full grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left transition-colors"
                    >
                      <span
                        className={`w-fit border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${METHOD_TONE[item.method]}`}
                      >
                        {item.method}
                      </span>
                      <span className="min-w-0">
                        <code className="text-text-1 block truncate font-mono text-xs">
                          {item.path}
                        </code>
                        <span className="text-text-3 text-[11px]">
                          {item.createdAt} · HTTP {item.status} · {item.durationMs}ms
                        </span>
                      </span>
                      <span
                        className={
                          item.passed === item.total
                            ? 'text-xs text-[#3fb950]'
                            : 'text-xs text-[#f85149]'
                        }
                      >
                        {item.passed}/{item.total}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <section className="border-line-2 bg-bg-3 border">
                <div className="border-line-2 flex items-center justify-between border-b px-3 py-2">
                  <div>
                    <h3 className="text-text-1 text-sm font-semibold">Authorization</h3>
                    <p className="text-text-3 mt-0.5 text-xs">
                      요청에 사용할 인증 방식을 선택합니다.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 p-3 md:grid-cols-[14rem_minmax(0,1fr)] md:items-end">
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-text-3 text-xs font-medium">Type</span>
                    <select
                      value={authType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setAuthType(e.target.value as AuthKind)
                      }
                      className={`h-10 ${fieldClass}`}
                    >
                      {AUTH_TYPES.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-text-3 text-xs font-medium">Value</span>
                    <input
                      data-testid="api-token"
                      value={token}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setToken(e.target.value)
                      }
                      placeholder={AUTH_TYPES.find((item) => item.key === authType)?.placeholder}
                      disabled={authType === 'none'}
                      className={`h-10 min-w-0 font-mono disabled:opacity-50 ${fieldClass}`}
                    />
                  </label>
                </div>
              </section>

              <section className="border-line-2 bg-bg-3 border">
                <div className="border-line-2 flex items-center justify-between gap-3 border-b px-3 py-2">
                  <div>
                    <h3 className="text-text-1 text-sm font-semibold">Headers</h3>
                    <p className="text-text-3 mt-0.5 text-xs">
                      키는 선택하고 값만 직접 입력합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addHeaderRow}
                    className="border-line-2 bg-bg-2 hover:bg-bg-1 inline-flex h-8 items-center gap-1 border px-2.5 text-xs transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Add
                  </button>
                </div>
                <div className="divide-line-2 divide-y">
                  <div className="text-text-3 hidden grid-cols-[2.5rem_14rem_minmax(0,1fr)_2.5rem] gap-2 px-3 py-2 text-[11px] font-semibold tracking-normal uppercase md:grid">
                    <span>Use</span>
                    <span>Key</span>
                    <span>Value</span>
                    <span />
                  </div>
                  {headerRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-2 p-3 md:grid-cols-[2.5rem_14rem_minmax(0,1fr)_2.5rem] md:items-center"
                    >
                      <label className="flex items-center gap-2 md:justify-center">
                        <DsCheckbox
                          checked={row.enabled}
                          onCheckedChange={(checked) =>
                            updateHeaderRow(row.id, { enabled: checked })
                          }
                          aria-label="헤더 사용"
                          className="border-line-3 bg-bg-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-text-3 text-xs md:hidden">사용</span>
                      </label>
                      <select
                        data-testid="api-header-key"
                        value={row.key}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          updateHeaderRow(row.id, { key: e.target.value as HeaderKey })
                        }
                        className={`h-9 font-mono ${fieldClass}`}
                      >
                        {HEADER_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                      <input
                        data-testid="api-headers"
                        value={row.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateHeaderRow(row.id, { value: e.target.value })
                        }
                        placeholder={
                          row.key === 'x-qaground-signature' ? 'test-signature' : 'value'
                        }
                        className={`h-9 min-w-0 font-mono ${fieldClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeHeaderRow(row.id)}
                        className="text-text-3 hover:text-system-red flex size-9 items-center justify-center transition-colors"
                        aria-label="헤더 삭제"
                        title="헤더 삭제"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
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
                        updateAssertion(a.id, {
                          kind: e.target.value as AssertKind,
                          path: e.target.value === 'status' ? '' : a.path,
                          expected: defaultExpectedForKind(e.target.value as AssertKind),
                        })
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
            <div className="border-line-2 bg-bg-3 border-b px-4 py-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end">
                <div className="min-w-0">
                  <h3 className="text-text-1 text-sm font-semibold">테스트 스크립트</h3>
                  <p className="text-text-3 mt-1 text-xs leading-relaxed">
                    선택한 API 요청에 연결된 pm.test 스크립트를 작성합니다. 엔드포인트마다
                    스크립트가 따로 저장됩니다.
                  </p>
                </div>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-text-3 text-xs font-medium">Script target</span>
                  <select
                    value={selectedCaseKey}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const requestCase = requestCases.find((item) => item.key === e.target.value);
                      if (requestCase) applyRequestCase(requestCase);
                    }}
                    className={`h-9 min-w-0 font-mono ${fieldClass}`}
                  >
                    {requestCases.map((requestCase) => (
                      <option key={requestCase.key} value={requestCase.key}>
                        {requestCase.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="text-text-3 mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`border px-1.5 py-0.5 font-mono font-semibold ${METHOD_TONE[method]}`}
                >
                  {method}
                </span>
                <code className="text-text-2 break-all">
                  {apiBase}
                  {path}
                </code>
                {selectedCase?.endpoint.auth && <span>인증 필요</span>}
                <span>기대 상태 {selectedCase?.expectedStatus ?? '200'}</span>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <MonacoEditor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={script}
                onChange={(value) =>
                  setScriptsByCase((prev) => ({
                    ...prev,
                    [selectedCaseKey]: value ?? '',
                  }))
                }
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
        aria-valuemin={120}
        aria-valuemax={520}
        aria-valuenow={resultH}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') setResultH((h) => Math.min(h + 16, 520));
          if (e.key === 'ArrowDown') setResultH((h) => Math.max(h - 16, 120));
        }}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="border-line-2 bg-bg-2 hover:bg-primary/20 focus:bg-primary/20 group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center border-t transition-colors outline-none"
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
          {result && (
            <span className="font-mono text-xs text-[#c9d1d9]">
              HTTP {result.status} · {result.durationMs}ms
            </span>
          )}
          {result && (
            <span
              className={`ml-auto font-mono text-xs ${passCount === total ? 'text-[#3fb950]' : 'text-[#f85149]'}`}
            >
              {passCount}/{total} passed
            </span>
          )}
        </div>
        {result && (
          <div className="flex shrink-0 items-center gap-1 border-b border-white/10 px-3 py-1.5">
            {resultTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setResultTab(tab.key)}
                className={`px-2.5 py-1 font-mono text-xs transition-colors ${
                  resultTab === tab.key
                    ? 'bg-white/10 text-[#f0f6fc]'
                    : 'text-[#8b949e] hover:bg-white/5 hover:text-[#c9d1d9]'
                }`}
              >
                {tab.label}
                {typeof tab.count === 'number' ? (
                  <span className="ml-1 text-[#8b949e]">{tab.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
        <div className="qg-code-scrollbar min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-[#c9d1d9]">
          {!result ? (
            term.length > 0 ? (
              <div className="space-y-1">
                {term.map((line) => (
                  <div key={line.id} className={API_TERM_CLASS[line.kind]}>
                    {line.text || ' '}
                  </div>
                ))}
                {running && <span className="animate-pulse text-[#8b949e]">▋</span>}
              </div>
            ) : (
              <span className="text-[#8b949e]">실행하면 응답과 검증 결과가 여기에 표시됩니다.</span>
            )
          ) : (
            <>
              {resultTab === 'body' && (
                <pre className="whitespace-pre-wrap text-[#c9d1d9]">{result.bodyText}</pre>
              )}
              {resultTab === 'checks' && (
                <div className="space-y-1">
                  {result.checks.length === 0 ? (
                    <span className="text-[#8b949e]">추가한 검증 조건이 없습니다.</span>
                  ) : (
                    result.checks.map((c, i) => (
                      <div key={i} className={c.pass ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                        {c.pass ? '✓' : '✗'} {c.label} · actual: {c.actual}
                      </div>
                    ))
                  )}
                </div>
              )}
              {resultTab === 'script' && (
                <div className="space-y-1">
                  {result.declaredScriptCount > result.scriptResults.length && (
                    <div className="mb-2 border border-[#d29922]/30 bg-[#d29922]/10 px-3 py-2 text-[#d29922]">
                      작성한 pm.test {result.declaredScriptCount}개 중 {result.scriptResults.length}
                      개만 실행됐습니다. 조건문이 false이면 그 안의 테스트는 결과와 채점에 포함되지
                      않습니다.
                    </div>
                  )}
                  {result.scriptResults.length === 0 ? (
                    <span className="text-[#8b949e]">실행된 pm.test 스크립트가 없습니다.</span>
                  ) : (
                    result.scriptResults.map((r, i) => (
                      <div key={i} className={r.pass ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                        {r.pass ? '✓' : '✗'} {r.name}
                        {r.error ? ` · ${r.error}` : ''}
                      </div>
                    ))
                  )}
                </div>
              )}
              {resultTab === 'headers' && (
                <div className="space-y-1">
                  {Object.entries(result.responseHeaders).map(([key, value]) => (
                    <div key={key} className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
                      <span className="text-[#8b949e]">{key}</span>
                      <span className="break-all text-[#c9d1d9]">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              {resultTab === 'grade' && (
                <div className="space-y-3">
                  <div className="text-[#8b949e]">
                    채점 결과 {result.hiddenGrade.score}/{result.hiddenGrade.maxScore}
                  </div>
                  <div
                    className={`border px-3 py-2 ${
                      result.hiddenGrade.score === result.hiddenGrade.maxScore
                        ? 'border-[#3fb950]/30 bg-[#3fb950]/10 text-[#3fb950]'
                        : 'border-[#d29922]/30 bg-[#d29922]/10 text-[#d29922]'
                    }`}
                  >
                    {result.hiddenGrade.score === result.hiddenGrade.maxScore
                      ? '제출 기준을 통과했습니다.'
                      : '아직 제출 기준을 모두 만족하지 못했습니다.'}
                  </div>
                  <p className="text-[#8b949e]">
                    세부 채점 항목과 보완 포인트는 제출 후 결과 페이지에서 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
