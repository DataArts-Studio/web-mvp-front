import type { TestCaseResultStatus } from '@/shared/types';
import { getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, desc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import 'server-only';

type Database = ReturnType<typeof getDatabase>;

export type MilestoneLatestResults = {
  /** 케이스별 가장 최근 실행 결과. 결과를 기록한 적 없는 케이스는 없다. */
  statuses: Map<string, TestCaseResultStatus>;
  /** 이 마일스톤 실행에서 결과를 기록한 가장 최근 시점. */
  lastExecutedAt: Date | null;
};

/**
 * 마일스톤에 연결된 삭제되지 않은 실행에서 케이스별 가장 최근 결과와 마지막 실행 시점을 구한다.
 * 실행 연결은 목록·상세·대시보드가 함께 읽는 실행의 마일스톤 값으로 본다 (#373).
 * 케이스 출처(마일스톤 직접·스위트 경유)와 상관없이 세야 스위트를 거친 케이스도 빠지지 않는다 (#414).
 * 결과 기준은 케이스 상태(#379)와 같다: 미실행이 아닌, 실행 시각이 있는 기록 중 가장 최근 것.
 */
export async function getMilestoneLatestResults(
  db: Database,
  milestoneIds: string[]
): Promise<Map<string, MilestoneLatestResults>> {
  const ids = [...new Set(milestoneIds)];
  const results = new Map<string, MilestoneLatestResults>();
  if (ids.length === 0) return results;

  const rows = await db
    .selectDistinctOn([testRuns.milestone_id, testCaseRuns.test_case_id], {
      milestoneId: testRuns.milestone_id,
      caseId: testCaseRuns.test_case_id,
      status: testCaseRuns.status,
      executedAt: testCaseRuns.executed_at,
    })
    .from(testCaseRuns)
    .innerJoin(testRuns, eq(testRuns.id, testCaseRuns.test_run_id))
    .where(
      and(
        inArray(testRuns.milestone_id, ids),
        eq(testRuns.lifecycle_status, 'ACTIVE'),
        isNull(testCaseRuns.excluded_at),
        ne(testCaseRuns.status, 'untested'),
        isNotNull(testCaseRuns.executed_at)
      )
    )
    .orderBy(testRuns.milestone_id, testCaseRuns.test_case_id, desc(testCaseRuns.executed_at));

  for (const row of rows) {
    if (!row.milestoneId || !row.caseId) continue;
    let entry = results.get(row.milestoneId);
    if (!entry) {
      entry = { statuses: new Map(), lastExecutedAt: null };
      results.set(row.milestoneId, entry);
    }
    entry.statuses.set(row.caseId, row.status);
    const executedAt = row.executedAt ? new Date(row.executedAt) : null;
    if (executedAt && (!entry.lastExecutedAt || executedAt > entry.lastExecutedAt)) {
      entry.lastExecutedAt = executedAt;
    }
  }
  return results;
}
