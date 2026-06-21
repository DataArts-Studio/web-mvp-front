import 'server-only';

/**
 * Testea → 자체 러너(apps/runner) HTTP 클라이언트.
 *
 * Vercel(서버리스)은 Playwright 를 못 돌리므로 접근성 캡처와 spec 실행을 러너가 한다.
 * Testea 는 fetch + LLM + DB 만. 러너 접속 정보는 env 로 주입한다:
 * - RUNNER_URL: 러너 베이스 URL (로컬 http://localhost:8080, prod 는 Fly URL).
 * - RUNNER_SHARED_SECRET: 러너 인증 시크릿. X-Runner-Secret 헤더로 전송.
 *
 * 둘 중 하나라도 없으면 명확한 에러를 던져 호출부가 운영 설정 누락을 알게 한다.
 */

export class RunnerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunnerConfigError';
  }
}

export class RunnerRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunnerRequestError';
  }
}

/** 러너 /capture 응답 계약. */
export interface RunnerCaptureResponse {
  ok: boolean;
  snapshot?: string;
  errorMessage?: string;
}

/** 러너 /run 응답 계약(run-spec.ts RunSpecResult 와 동형). */
export interface RunnerRunResponse {
  ok: boolean;
  status: string;
  durationMs: number;
  errorMessage?: string;
}

function getRunnerConfig(): { url: string; secret: string } {
  const url = process.env.RUNNER_URL;
  const secret = process.env.RUNNER_SHARED_SECRET;
  if (!url) {
    throw new RunnerConfigError('RUNNER_URL is not set.');
  }
  if (!secret) {
    throw new RunnerConfigError('RUNNER_SHARED_SECRET is not set.');
  }
  return { url: url.replace(/\/+$/, ''), secret };
}

async function postToRunner<T>(path: string, payload: unknown): Promise<T> {
  const { url, secret } = getRunnerConfig();

  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Runner-Secret': secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    throw new RunnerRequestError(
      `Failed to reach runner at ${url}${path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!res.ok) {
    throw new RunnerRequestError(`Runner ${path} responded ${res.status}.`);
  }

  return (await res.json()) as T;
}

/**
 * 러너 /capture 호출: 대상 페이지 접근성 스냅샷을 받는다.
 */
export async function captureSnapshot(input: {
  url: string;
  storageState?: unknown;
  timeoutMs?: number;
}): Promise<RunnerCaptureResponse> {
  return postToRunner<RunnerCaptureResponse>('/capture', input);
}

/**
 * 러너 /run 호출: 생성된 spec 을 격리 실행하고 pass/fail 을 받는다.
 */
export async function runSpecOnRunner(input: {
  spec: string;
  baseUrl?: string;
  storageState?: unknown;
  timeoutMs?: number;
}): Promise<RunnerRunResponse> {
  return postToRunner<RunnerRunResponse>('/run', input);
}
