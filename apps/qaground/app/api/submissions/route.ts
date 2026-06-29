import { NextResponse } from 'next/server';

import { gradeApiAttempts } from '@/shared/challenges/api-hidden-grader';
import { getChallenge } from '@/shared/challenges/registry';
import { getDatabase, qagroundSubmissions } from '@testea/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z
  .object({
    slug: z.string().min(1).max(80),
    kind: z.enum(['code', 'api', 'defect', 'testcase']),
    content: z.unknown(),
    result: z.unknown().optional(),
    anonId: z.string().max(64).optional(),
  })
  .strict();

const ApiAssertionSchema = z
  .object({
    kind: z.enum(['status', 'json']),
    path: z.string(),
    expected: z.string(),
  })
  .strict();

const ApiCheckSchema = z.object({ pass: z.boolean() }).passthrough();

const ApiAttemptSchema = z
  .object({
    method: z.string(),
    path: z.string(),
    status: z.number().int(),
    assertions: z.array(ApiAssertionSchema),
    script: z.string(),
    checks: z.array(ApiCheckSchema),
    scriptResults: z.array(ApiCheckSchema),
  })
  .strict();

const ApiContentSchema = z
  .object({
    attempts: z.array(ApiAttemptSchema).max(100),
  })
  .passthrough();

// 제출 내용 jsonb 크기 상한(직렬화 기준). 남용·과대 페이로드 차단.
const MAX_CONTENT_BYTES = 50_000;

// 간단 인메모리 레이트리밋(서버 인스턴스별). 제출은 빈번하므로 이슈보다 넉넉히.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/**
 * POST /api/submissions
 *
 * qaground 연습 챌린지의 사용자 제출(코드·답안)과 결과를 익명으로 저장한다.
 *
 * - 로그인 없음. anon_id(클라 localStorage UUID)로만 같은 브라우저를 느슨히 묶고 개인정보는 없다.
 * - 베스트 에포트 기록: 클라이언트는 응답을 기다리지 않으므로 실패해도 제출 UX 에 영향 없음.
 * - 공개 경로이므로 검증 + 크기 상한 + 레이트리밋으로 남용을 막는다.
 * - DB 접근은 서버(연결) 경유. 테이블은 RLS deny-anon.
 */
export async function POST(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const challenge = getChallenge(parsed.data.slug);
  if (!challenge) {
    return NextResponse.json({ ok: false, error: 'unknown_challenge' }, { status: 400 });
  }

  const contentBytes = JSON.stringify(parsed.data.content ?? null).length;
  if (contentBytes > MAX_CONTENT_BYTES) {
    return NextResponse.json({ ok: false, error: 'content_too_large' }, { status: 413 });
  }

  const apiContent =
    parsed.data.kind === 'api' ? ApiContentSchema.safeParse(parsed.data.content) : null;
  const serverResult =
    apiContent?.success && challenge.endpoints
      ? {
          ...(parsed.data.result && typeof parsed.data.result === 'object'
            ? parsed.data.result
            : {}),
          hiddenGrade: gradeApiAttempts(apiContent.data.attempts, { targets: challenge.endpoints }),
        }
      : (parsed.data.result ?? null);

  try {
    const db = getDatabase();
    await db.insert(qagroundSubmissions).values({
      challenge_slug: challenge.slug,
      track: challenge.track,
      kind: parsed.data.kind,
      content: parsed.data.content ?? {},
      result: serverResult,
      anon_id: parsed.data.anonId ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[submissions] 저장 실패', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
