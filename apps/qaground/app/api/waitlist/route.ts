import { NextResponse } from 'next/server';

import { createMagicToken } from '@/shared/magic-link/token';
import { getDatabase, qagroundWaitlist } from '@testea/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
  })
  .strict();

/**
 * qaground 비공개 베타 대기자 신청 수신.
 *
 * - 외부 입력을 신뢰하지 않는다: zod 로 이메일 검증·정규화(소문자) 후 저장.
 * - 중복 이메일은 unique 제약으로 무시하고 성공(alreadyJoined) 으로 응답한다.
 * - DB 접근은 서버(service_role 연결) 경유. 테이블은 RLS deny-anon.
 * - TODO: 봇/스팸 방지(Turnstile)·레이트리밋은 후속. 현재는 검증·중복무시까지.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const inserted = await db
      .insert(qagroundWaitlist)
      .values({ email: parsed.data.email, source: 'beta-landing' })
      .onConflictDoNothing({ target: qagroundWaitlist.email })
      .returning({ id: qagroundWaitlist.id });

    // 매직링크 토큰 발급. 메일 발송 인프라는 후속(#242) — 현재는 stub:
    // 서버 로그에 링크를 남기고, 비프로덕션에서만 응답에 노출해 폐루프를 확인한다.
    const token = await createMagicToken(parsed.data.email);
    const origin = new URL(request.url).origin;
    const magicLink = `${origin}/api/magic/verify?token=${token}`;
    console.info('[waitlist] 매직링크(stub, 메일 발송 전):', magicLink);

    return NextResponse.json({
      ok: true,
      alreadyJoined: inserted.length === 0,
      ...(process.env.NODE_ENV !== 'production' ? { devMagicLink: magicLink } : {}),
    });
  } catch (error) {
    console.error('[waitlist] 대기자 저장 실패', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
