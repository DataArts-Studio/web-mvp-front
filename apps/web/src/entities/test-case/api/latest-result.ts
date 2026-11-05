import type { TestCaseResultStatus } from '@/shared/types';
import { getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, desc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
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
