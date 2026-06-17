import { NextResponse } from 'next/server';

import { getDatabase, milestones, testCaseRuns, testRuns } from '@testea/db';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// 운영에서는 내부 에러 메시지·스택·DB 설정을 응답에 노출하지 않는다 (정보 누출 방지).
// 상세 진단은 비운영(dev/preview)에서만 반환한다.
const isProd = process.env.VERCEL_ENV === 'production';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const db = getDatabase();

    // 1. Simple query
    await db.execute(sql`select 1 as ok`);
    results.ping = { ok: true };

    // 2. Milestone select
    const [m] = await db.select().from(milestones).limit(1);
    results.milestone = { ok: true, found: !!m };

    // 3. Test runs select
    const runList = await db.select().from(testRuns).limit(3);
    results.testRuns = { ok: true, count: runList.length };

    // 4. Test case runs select
    if (runList.length > 0) {
      const caseRuns = await db
        .select()
        .from(testCaseRuns)
        .where(eq(testCaseRuns.test_run_id, runList[0].id));
      results.testCaseRuns = { ok: true, count: caseRuns.length };
    }
  } catch (e) {
    results.ok = false;
    // 상세는 서버 로그에만 남기고, 운영 응답에는 노출하지 않는다.
    console.error('[health] check failed:', e);
    if (!isProd) {
      results.error = {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split('\n').slice(0, 3) : undefined,
      };
    }
  }

  if (!isProd) {
    results.env = {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.SUPABASE_DB_URL,
      dbUrlPort: process.env.SUPABASE_DB_URL?.match(/:(\d+)\//)?.[1] || 'unknown',
    };
  }

  return NextResponse.json(results);
}
