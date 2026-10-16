import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import crypto from 'node:crypto';

import { captureInSandbox } from './capture-sandbox.js';
import {
  egressBlocksExecution,
  egressFilterActive,
  egressMode,
  installEgressFilter,
} from './egress-filter.js';
import { runSpec } from './run-spec.js';
import {
  SANDBOX_UID,
  isolationAvailable,
  sandboxCompromised,
  unisolatedRunAllowed,
} from './sandbox.js';
import { checkTargetUrl } from './url-guard.js';

const app = new Hono();

const PORT = Number(process.env.PORT ?? 8080);
const SHARED_SECRET = process.env.RUNNER_SHARED_SECRET;

// spec·캡처를 받기 전에 sandbox uid 의 나가는 연결 차단을 건다 (egress-filter.ts).
if (isolationAvailable()) installEgressFilter(SANDBOX_UID, PORT);

/** 상수 시간 시크릿 비교 (타이밍 사이드채널 완화). */
function secretsMatch(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 헬스체크. 인증 예외.
 */
app.get('/health', (c) => {
  // 잔여 spec 프로세스를 정리하지 못한 인스턴스는 unhealthy 로 알려 플랫폼이 교체하게 한다.
  if (sandboxCompromised()) {
    return c.json({ ok: false, error: 'Sandbox compromised.' }, 503);
  }
  return c.json({
    ok: true,
    egressFilter: egressFilterActive() ? 'active' : egressMode() === 'off' ? 'off' : 'inactive',
  });
});

/**
 * 공유 시크릿 인증 미들웨어. /health 를 제외한 전 경로에 적용.
 * 헤더 X-Runner-Secret 가 RUNNER_SHARED_SECRET 와 일치해야 통과.
 */
app.use('*', async (c, next) => {
  if (c.req.path === '/health') {
    return next();
  }

  // 시크릿 미설정은 운영 사고. 어떤 요청도 통과시키지 않는다.
  if (!SHARED_SECRET) {
    return c.json({ ok: false, error: 'Runner is not configured.' }, 503);
  }

  const provided = c.req.header('X-Runner-Secret');
  if (!secretsMatch(provided, SHARED_SECRET)) {
    return c.json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  return next();
});

/**
 * 한 번에 하나의 spec·캡처만 실행한다. 같은 sandbox uid 로 도는 run 끼리는 파일 권한으로
 * 서로를 막을 수 없으므로, 동시 실행 자체를 없애는 것이 run 간 격리의 본 수단이다.
 * (Cloud Run concurrency=1 / Fly hard_limit=1 과 같은 전제를 코드에서도 강제한다.)
 * 캡처도 같은 uid 로 돌고 끝나면 그 uid 의 프로세스를 전부 정리하므로 같은 잠금을 쓴다.
 */
let runInFlight = false;

/** 실행 전 공통 거부 사유. 없으면 null. */
function sandboxRefusal(): string | null {
  if (sandboxCompromised()) return 'Runner sandbox is compromised.';
  if (isolationAvailable() && egressBlocksExecution()) {
    return 'Runner sandbox egress filter is unavailable.';
  }
  return null;
}

interface RunRequestBody {
  spec?: unknown;
  baseUrl?: unknown;
  storageState?: unknown;
  timeoutMs?: unknown;
}

/**
 * POST /run
 * body: { spec: string, baseUrl?: string, storageState?: object, timeoutMs?: number }
 * res:  { ok, status, durationMs, errorMessage }
 *
 * spec 은 임의 코드 실행이다. 격리 컨테이너 + 인증된 Testea 호출 전제.
 */
app.post('/run', async (c) => {
  let body: RunRequestBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  if (typeof body.spec !== 'string' || body.spec.trim().length === 0) {
    return c.json({ ok: false, error: 'Field "spec" (non-empty string) is required.' }, 400);
  }

  if (body.baseUrl !== undefined && typeof body.baseUrl !== 'string') {
    return c.json({ ok: false, error: 'Field "baseUrl" must be a string.' }, 400);
  }

  if (typeof body.baseUrl === 'string') {
    const urlError = checkTargetUrl(body.baseUrl);
    if (urlError) {
      return c.json({ ok: false, error: `Field "baseUrl": ${urlError}` }, 400);
    }
  }

  if (
    body.timeoutMs !== undefined &&
    (typeof body.timeoutMs !== 'number' || !Number.isFinite(body.timeoutMs) || body.timeoutMs <= 0)
  ) {
    return c.json({ ok: false, error: 'Field "timeoutMs" must be a positive number.' }, 400);
  }

  // fail-closed: uid 분리 격리를 못 쓰면 비신뢰 코드를 실행하지 않는다.
  if (!isolationAvailable() && !unisolatedRunAllowed()) {
    return c.json({ ok: false, error: 'Runner sandbox isolation is unavailable.' }, 503);
  }

  const refusal = sandboxRefusal();
  if (refusal) {
    return c.json({ ok: false, error: refusal }, 503);
  }

  if (runInFlight) {
    c.header('Retry-After', '5');
    return c.json({ ok: false, error: 'Runner is busy.' }, 503);
  }

  runInFlight = true;
  try {
    const result = await runSpec({
      spec: body.spec,
      baseUrl: body.baseUrl,
      storageState: body.storageState,
      timeoutMs: body.timeoutMs,
    });
    return c.json(result);
  } finally {
    runInFlight = false;
  }
});

interface CaptureRequestBody {
  url?: unknown;
  storageState?: unknown;
  timeoutMs?: unknown;
}

/**
 * POST /capture
 * body: { url: string, storageState?: object, timeoutMs?: number }
 * res:  { ok, snapshot?, errorMessage? }
 *
 * 대상 페이지를 열어 접근성 트리(main 또는 body 의 ariaSnapshot)를 반환한다.
 * Testea 는 이 스냅샷을 코드 생성 LLM 입력으로 쓴다. /run 과 동일 인증.
 */
app.post('/capture', async (c) => {
  let body: CaptureRequestBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  if (typeof body.url !== 'string' || body.url.trim().length === 0) {
    return c.json({ ok: false, error: 'Field "url" (non-empty string) is required.' }, 400);
  }

  const urlError = checkTargetUrl(body.url);
  if (urlError) {
    return c.json({ ok: false, error: `Field "url": ${urlError}` }, 400);
  }

  if (
    body.timeoutMs !== undefined &&
    (typeof body.timeoutMs !== 'number' || !Number.isFinite(body.timeoutMs) || body.timeoutMs <= 0)
  ) {
    return c.json({ ok: false, error: 'Field "timeoutMs" must be a positive number.' }, 400);
  }

  const refusal = sandboxRefusal();
  if (refusal) {
    return c.json({ ok: false, error: refusal }, 503);
  }

  if (runInFlight) {
    c.header('Retry-After', '5');
    return c.json({ ok: false, error: 'Runner is busy.' }, 503);
  }

  runInFlight = true;
  try {
    const result = await captureInSandbox({
      url: body.url,
      storageState: body.storageState,
      timeoutMs: body.timeoutMs,
    });
    return c.json(result);
  } finally {
    runInFlight = false;
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  // 시크릿 미설정 경고. 컨테이너 부팅 로그에서 바로 확인 가능.
  if (!SHARED_SECRET) {
    console.warn(
      '[runner] RUNNER_SHARED_SECRET is not set. /run will reject all requests with 503.'
    );
  }
  if (!isolationAvailable()) {
    console.warn(
      unisolatedRunAllowed()
        ? '[runner] Sandbox isolation unavailable. RUNNER_ALLOW_UNISOLATED=1, running specs without uid isolation (local dev only).'
        : '[runner] Sandbox isolation unavailable (not root on Linux). /run will reject all requests with 503.'
    );
  }
  if (isolationAvailable() && !egressFilterActive()) {
    console.warn(
      egressMode() === 'required'
        ? '[runner] Sandbox egress filter could not be installed. /run and /capture will reject all requests with 503.'
        : `[runner] Sandbox egress filter is not active (RUNNER_EGRESS_FILTER=${egressMode()}).`
    );
  }
  console.log(`[runner] listening on :${info.port}`);
});
