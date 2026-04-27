import { NextResponse } from 'next/server';
import { getDatabase, milestones, testRuns, testCaseRuns } from '@/shared/lib/db';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
      const caseRuns = await db.select().from(testCaseRuns).where(eq(testCaseRuns.test_run_id, runList[0].id));
      results.testCaseRuns = { ok: true, count: caseRuns.length };
    }
  } catch (e: any) {
    results.error = { message: e.message, stack: e.stack?.split('\n').slice(0, 3) };
  }

  results.env = {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.SUPABASE_DB_URL,
    dbUrlPort: process.env.SUPABASE_DB_URL?.match(/:(\d+)\//)?.[1] || 'unknown',
  };

  return NextResponse.json(results);
}
