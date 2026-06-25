import { NextResponse } from 'next/server';

import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_TOKEN } from '@/shared/practice-api/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/practice/auth/login
 * - 유효 자격증명: 200 { token }
 * - 무효 자격증명: 401 { error }
 * - 잘못된 본문: 400 { error }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'email과 password가 필요합니다.' }, { status: 400 });
  }

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return NextResponse.json({ token: DEMO_TOKEN });
  }

  return NextResponse.json({ error: '자격증명이 올바르지 않습니다.' }, { status: 401 });
}
