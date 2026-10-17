import { NextResponse } from 'next/server';

import { getDatabase } from '@testea/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// 인증 없는 공개 엔드포인트라 DB 연결 확인 한 번만 하고, 에러 메시지·스택·DB 설정은
// 환경과 무관하게 응답에 넣지 않는다. 상세는 서버 로그로만 남긴다.
export async function GET() {
  try {
    await getDatabase().execute(sql`select 1 as ok`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[health] check failed:', e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
