import type { TestCaseResultStatus } from '@/shared/types';
import { getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, asc, desc, eq, inArray, isNotNull, lte, ne, sql } from 'drizzle-orm';
import 'server-only';

type Database = ReturnType<typeof getDatabase>;

/**
 * 케이스 상태는 마지막 실행 결과로 정한다 (#379).
 * 삭제되지 않은 실행에서 결과를 기록한 케이스 런 중 가장 최근 것을 고르고,
 * 한 번도 실행되지 않은 케이스는 맵에 없으므로 호출하는 쪽에서 untested 로 본다.
 */
export async function getLatestResultStatuses(
  db: Database,
  caseIds: string[]
): Promise<Map<string, TestCaseResultStatus>> {
  const ids = [...new Set(caseIds)];
  if (ids.length === 0) return new Map();

  const rows = await db
    .selectDistinctOn([testCaseRuns.test_case_id], {
      caseId: testCaseRuns.test_case_id,
      status: testCaseRuns.status,
    })
    .from(testCaseRuns)
    .innerJoin(testRuns, eq(testRuns.id, testCaseRuns.test_run_id))
    .where(
      and(
        inArray(testCaseRuns.test_case_id, ids),
        ne(testCaseRuns.status, 'untested'),
        isNotNull(testCaseRuns.executed_at),
        eq(testRuns.lifecycle_status, 'ACTIVE')
      )
    )
    .orderBy(testCaseRuns.test_case_id, desc(testCaseRuns.executed_at));

  const statuses = new Map<string, TestCaseResultStatus>();
  for (const row of rows) {
    if (row.caseId) statuses.set(row.caseId, row.status);
  }
  return statuses;
}

/** 목록 행의 최근 결과 칸 수 */
export const RECENT_RESULT_LIMIT = 5;

/**
 * 케이스마다 최근 실행 결과를 오래된 것부터 최대 limit 개 돌려준다.
 * getLatestResultStatuses 와 같은 기준(삭제되지 않은 실행, 결과를 기록한 케이스 런)을 쓰므로
 * 배열의 마지막 값이 그 케이스의 현재 상태와 같다.
 */
export async function getRecentResultStatuses(
  db: Database,
  caseIds: string[],
  limit = RECENT_RESULT_LIMIT
): Promise<Map<string, TestCaseResultStatus[]>> {
  const ids = [...new Set(caseIds)];
  if (ids.length === 0) return new Map();

  const ranked = db
    .select({
      caseId: testCaseRuns.test_case_id,
      status: testCaseRuns.status,
      executedAt: testCaseRuns.executed_at,
      rank: sql<number>`row_number() over (partition by ${testCaseRuns.test_case_id} order by ${testCaseRuns.executed_at} desc)`.as(
        'rank'
      ),
    })
    .from(testCaseRuns)
    .innerJoin(testRuns, eq(testRuns.id, testCaseRuns.test_run_id))
    .where(
      and(
        inArray(testCaseRuns.test_case_id, ids),
        ne(testCaseRuns.status, 'untested'),
        isNotNull(testCaseRuns.executed_at),
        eq(testRuns.lifecycle_status, 'ACTIVE')
      )
    )
    .as('ranked');

  const rows = await db
    .select({ caseId: ranked.caseId, status: ranked.status })
    .from(ranked)
    .where(lte(ranked.rank, limit))
    .orderBy(ranked.caseId, asc(ranked.executedAt));

  const results = new Map<string, TestCaseResultStatus[]>();
  for (const row of rows) {
    if (!row.caseId) continue;
    const list = results.get(row.caseId) ?? [];
    list.push(row.status);
    results.set(row.caseId, list);
  }
  return results;
}
