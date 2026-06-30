'use client';

import { useMemo, useState } from 'react';

import { Play, Plus, RotateCcw } from 'lucide-react';

type Method = 'GET' | 'POST';
type ScriptResult = { name: string; pass: boolean; message?: string };
type ResponseSnapshot = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyText: string;
  json: unknown;
};

const DEFAULT_BODY = '{\n  "email": "tester@qaground.dev",\n  "password": "qaground123"\n}';
const DEFAULT_HEADERS = '{\n  "Content-Type": "application/json"\n}';
const DEFAULT_SCRIPT = `pm.test('로그인 성공 상태 코드', () => {
  pm.response.to.have.status(200);
});

pm.test('토큰을 반환한다', () => {
  const json = pm.response.json();
  pm.expect(json.token).to.eql('qaground-demo-token');
});`;

const ENDPOINTS: { label: string; method: Method; path: string; body: string; headers: string }[] =
  [
    {
      label: '로그인',
      method: 'POST',
      path: '/api/practice/auth/login',
      body: DEFAULT_BODY,
      headers: DEFAULT_HEADERS,
    },
    {
      label: '상품 목록',
      method: 'GET',
      path: '/api/practice/products',
      body: '',
      headers: DEFAULT_HEADERS,
    },
    {
      label: '상태 코드 404',
      method: 'GET',
      path: '/api/practice/status/404',
      body: '',
      headers: DEFAULT_HEADERS,
    },
  ];

const SNIPPETS = [
  {
    label: '상태 코드',
    code: `\npm.test('상태 코드는 200', () => {
  pm.response.to.have.status(200);
});`,
  },
  {
    label: 'JSON 필드',
    code: `\npm.test('응답 JSON 필드를 확인한다', () => {
  const json = pm.response.json();
  pm.expect(json.token).to.eql('qaground-demo-token');
});`,
  },
  {
    label: '배열 길이',
    code: `\npm.test('목록을 반환한다', () => {
  const json = pm.response.json();
  pm.expect(json.items.length).to.be.above(0);
});`,
  },
];

function parseHeaders(raw: string): Record<string, string> {
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('headers는 JSON object여야 합니다.');
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : String(value),
    ])
  );
}

function tryParseJson(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function createExpectation(actual: unknown) {
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };

  return {
    to: {
      eql(expected: unknown) {
        assert(
          JSON.stringify(actual) === JSON.stringify(expected),
          `${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`
        );
      },
      equal(expected: unknown) {
        assert(actual === expected, `${String(actual)} !== ${String(expected)}`);
      },
      include(expected: unknown) {
        assert(
          String(actual).includes(String(expected)),
          `${String(actual)} does not include ${String(expected)}`
        );
      },
      be: {
        above(expected: number) {
          assert(
            typeof actual === 'number' && actual > expected,
            `${String(actual)} is not above ${expected}`
          );
        },
      },
    },
  };
}

function runScript(script: string, response: ResponseSnapshot): ScriptResult[] {
  const results: ScriptResult[] = [];
  const pm = {
    response: {
      code: response.status,
      status: response.statusText,
      headers: response.headers,
      text: () => response.bodyText,
      json: () => response.json,
      to: {
        have: {
          status: (expected: number) => {
            if (response.status !== expected) {
              throw new Error(`expected ${expected}, received ${response.status}`);
            }
          },
        },
      },
    },
    test: (name: string, fn: () => void) => {
      try {
        fn();
        results.push({ name, pass: true });
      } catch (error) {
        results.push({
          name,
          pass: false,
          message: error instanceof Error ? error.message : '스크립트 실행 실패',
        });
      }
    },
    expect: createExpectation,
  };

  new Function('pm', script)(pm);
  return results;
}

export const PostmanScriptTool = () => {
  const [method, setMethod] = useState<Method>('POST');
  const [path, setPath] = useState('/api/practice/auth/login');
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [response, setResponse] = useState<ResponseSnapshot | null>(null);
  const [results, setResults] = useState<ScriptResult[]>([]);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const passed = results.filter((item) => item.pass).length;
  const responsePreview = useMemo(() => {
    if (!response) return '아직 요청을 보내지 않았습니다.';
    return response.json ? JSON.stringify(response.json, null, 2) : response.bodyText;
  }, [response]);

  const applyEndpoint = (label: string) => {
    const endpoint = ENDPOINTS.find((item) => item.label === label);
    if (!endpoint) return;
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setBody(endpoint.body);
    setHeaders(endpoint.headers);
    setError('');
  };

  const appendSnippet = (code: string) => {
    setScript((current) => `${current.trimEnd()}\n${code.trimStart()}`);
  };

  const run = async () => {
    setIsRunning(true);
    setError('');
    setResults([]);

    try {
      const requestHeaders = parseHeaders(headers);
      const res = await fetch(path, {
        method,
        headers: requestHeaders,
        body: method === 'GET' ? undefined : body,
      });
      const bodyText = await res.text();
      const snapshot: ResponseSnapshot = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyText,
        json: tryParseJson(bodyText),
      };
      setResponse(snapshot);
      setResults(script.trim() ? runScript(script, snapshot) : []);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : '요청 실행에 실패했습니다.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="mt-6 grid min-h-[640px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)_420px]">
      <aside className="border-line-2 bg-bg-2 rounded-lg border">
        <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Request</h2>
          <button
            type="button"
            onClick={() => applyEndpoint('로그인')}
            className="text-text-3 hover:text-text-1 inline-flex items-center gap-1 text-xs transition-colors"
          >
            <RotateCcw size={13} /> 초기화
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            {ENDPOINTS.map((endpoint) => (
              <button
                key={endpoint.label}
                type="button"
                onClick={() => applyEndpoint(endpoint.label)}
                className="border-line-2 hover:bg-bg-3 rounded-md border px-2 py-2 text-xs transition-colors"
              >
                {endpoint.label}
              </button>
            ))}
          </div>

          <label className="text-text-3 block text-xs font-medium">Method</label>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as Method)}
            className="border-line-2 bg-bg-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            <option>GET</option>
            <option>POST</option>
          </select>

          <label className="text-text-3 block text-xs font-medium">URL</label>
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            className="border-line-2 bg-bg-1 h-9 w-full rounded-md border px-3 font-mono text-sm"
          />

          <label className="text-text-3 block text-xs font-medium">Headers JSON</label>
          <textarea
            value={headers}
            onChange={(event) => setHeaders(event.target.value)}
            className="border-line-2 bg-bg-1 h-28 w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />

          <label className="text-text-3 block text-xs font-medium">Body</label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={method === 'GET'}
            className="border-line-2 bg-bg-1 h-36 w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed disabled:opacity-45"
            spellCheck={false}
          />
        </div>
      </aside>

      <div className="border-line-2 bg-bg-2 rounded-lg border">
        <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Script</h2>
          <div className="flex items-center gap-2">
            {SNIPPETS.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => appendSnippet(snippet.code)}
                className="border-line-2 hover:bg-bg-3 inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors"
              >
                <Plus size={12} /> {snippet.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={script}
          onChange={(event) => setScript(event.target.value)}
          className="h-[calc(100%-48px)] min-h-[590px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
          spellCheck={false}
        />
      </div>

      <aside className="border-line-2 bg-bg-2 rounded-lg border">
        <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Response</h2>
          <button
            type="button"
            onClick={run}
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold text-white transition-colors disabled:opacity-60"
          >
            <Play size={13} /> {isRunning ? '실행 중' : '요청 실행'}
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error ? (
            <div className="border-line-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="border-line-2 rounded-md border p-3">
              <p className="text-text-3 text-xs">Status</p>
              <p className="mt-1 font-mono text-lg">{response?.status ?? '-'}</p>
            </div>
            <div className="border-line-2 rounded-md border p-3">
              <p className="text-text-3 text-xs">pm.test</p>
              <p className="mt-1 font-mono text-lg">
                {results.length ? `${passed}/${results.length}` : '-'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-text-3 mb-2 text-xs font-medium">Body</h3>
            <pre className="border-line-2 bg-bg-1 max-h-64 overflow-auto rounded-md border p-3 text-xs leading-relaxed">
              <code>{responsePreview}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-text-3 mb-2 text-xs font-medium">Script Results</h3>
            <div className="space-y-2">
              {results.length === 0 ? (
                <p className="text-text-3 border-line-2 rounded-md border p-3 text-sm">
                  스크립트 결과가 여기에 표시됩니다.
                </p>
              ) : (
                results.map((result) => (
                  <div key={result.name} className="border-line-2 rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>{result.name}</span>
                      <span className={result.pass ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                        {result.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    {result.message ? (
                      <p className="text-text-3 mt-1 text-xs">{result.message}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
};
