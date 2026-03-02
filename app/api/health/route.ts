import { NextResponse } from 'next/server';
import { getDatabase, milestones, testRuns } from '@/shared/lib/db';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Simple query
  try {
    const db = getDatabase();
    const health = await db.execute(sql`select 1 as ok`);
    results.simpleQuery = { ok: true };
  } catch (e: any) {
    results.simpleQuery = { ok: false, error: e.message };
  }

  // 2. Milestone relational query (with nested joins)
  try {
    const db = getDatabase();
    const m = await db.query.milestones.findFirst({
      with: {
        testRuns: {
          with: {
            testCaseRuns: {
              with: { testCase: true },
            },
          },
        },
        milestoneTestCases: {
          with: { testCase: true },
        },
      },
    });
    results.milestoneRelational = { ok: true, found: !!m, id: m?.id };
  } catch (e: any) {
    results.milestoneRelational = { ok: false, error: e.message };
  }

  // 3. Test runs relational query
  try {
    const db = getDatabase();
    const runs = await db.query.testRuns.findMany({
      with: {
        testRunSuites: { with: { testSuite: true } },
        milestone: true,
        testCaseRuns: true,
      },
      limit: 1,
    });
    results.testRunsRelational = { ok: true, count: runs.length };
  } catch (e: any) {
    results.testRunsRelational = { ok: false, error: e.message };
  }

  // 4. Environment info
  results.env = {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.SUPABASE_DB_URL,
    dbUrlPort: process.env.SUPABASE_DB_URL?.match(/:(\d+)\//)?.[1] || 'unknown',
  };

  const allOk = Object.values(results)
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null && 'ok' in v)
    .every((v) => v.ok);

  return NextResponse.json(results, { status: allOk ? 200 : 500 });
}
