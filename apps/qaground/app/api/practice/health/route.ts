import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode');
  if (mode === 'degraded') {
    return NextResponse.json(
      { status: 'degraded', checks: { database: 'ok', queue: 'slow' } },
      { status: 503 }
    );
  }
  return NextResponse.json({ status: 'ok', checks: { database: 'ok', queue: 'ok' } });
}
