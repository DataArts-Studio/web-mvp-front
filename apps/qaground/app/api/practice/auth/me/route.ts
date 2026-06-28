import { NextResponse } from 'next/server';

import { DEMO_TOKEN } from '@/shared/practice-api/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth === 'Bearer expired-token') {
    return NextResponse.json({ error: 'token_expired' }, { status: 401 });
  }
  if (auth !== `Bearer ${DEMO_TOKEN}`) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json({ id: 1, email: 'tester@qaground.dev', role: 'member' });
}
