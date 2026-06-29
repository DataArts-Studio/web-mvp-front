import { NextResponse } from 'next/server';

import { DEMO_TOKEN } from '@/shared/practice-api/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const refreshToken = (body as { refreshToken?: unknown } | null)?.refreshToken;
  if (refreshToken !== 'qaground-refresh-token') {
    return NextResponse.json({ error: 'invalid_refresh_token' }, { status: 401 });
  }

  return NextResponse.json({ token: DEMO_TOKEN, expiresIn: 3600 });
}
