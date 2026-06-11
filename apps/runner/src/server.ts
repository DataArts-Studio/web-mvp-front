import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import crypto from 'node:crypto';

import { capture } from './capture.js';
import { runSpec } from './run-spec.js';
import { checkTargetUrl } from './url-guard.js';

const app = new Hono();

const PORT = Number(process.env.PORT ?? 8080);
const SHARED_SECRET = process.env.RUNNER_SHARED_SECRET;

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
app.get('/health', (c) => c.json({ ok: true }));

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

  const result = await runSpec({
    spec: body.spec,
    baseUrl: body.baseUrl,
    storageState: body.storageState,
    timeoutMs: body.timeoutMs,
  });

  return c.json(result);
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

  const result = await capture({
    url: body.url,
    storageState: body.storageState,
    timeoutMs: body.timeoutMs,
  });

  return c.json(result);
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  // 시크릿 미설정 경고. 컨테이너 부팅 로그에서 바로 확인 가능.
  if (!SHARED_SECRET) {
    console.warn(
      '[runner] RUNNER_SHARED_SECRET is not set. /run will reject all requests with 503.'
    );
  }
  console.log(`[runner] listening on :${info.port}`);
});
