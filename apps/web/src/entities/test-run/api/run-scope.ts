import {
  TestCaseRunSourceType,
  TestRunStatus,
  getDatabase,
  testCaseRuns,
  testRuns,
} from '@testea/db';
import { and, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import 'server-only';
import { v7 as uuidv7 } from 'uuid';

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type Executor = Database | Transaction;

type RunCaseEntry = {
  caseId: string;
  sourceType: TestCaseRunSourceType;
  sourceId: string | null;
};

/**
 * 실행 범위에 케이스를 넣는다. 예전에 제외된 행은 기록한 결과와 함께 되살리고,
 * 실행에 한 번도 없던 케이스만 새로 만든다 (#375). 넣거나 되살린 케이스 수를 돌려준다.
 */
export async function addCasesToRunScope(
  db: Executor,
  runId: string,
  entries: RunCaseEntry[]
): Promise<number> {
  const byCaseId = new Map(entries.map((entry) => [entry.caseId, entry]));
  const caseIds = [...byCaseId.keys()];
  if (caseIds.length === 0) return 0;

  const restored = await db
    .update(testCaseRuns)
    .set({ excluded_at: null, updated_at: new Date() })
    .where(
      and(
        eq(testCaseRuns.test_run_id, runId),
        inArray(testCaseRuns.test_case_id, caseIds),
        isNotNull(testCaseRuns.excluded_at)
      )
    )
    .returning({ caseId: testCaseRuns.test_case_id });

  const existing = await db
    .select({ test_case_id: testCaseRuns.test_case_id })
    .from(testCaseRuns)
    .where(and(eq(testCaseRuns.test_run_id, runId), inArray(testCaseRuns.test_case_id, caseIds)));
  const existingIds = new Set(existing.map((row) => row.test_case_id));

  const now = new Date();
  const created = caseIds
    .filter((caseId) => !existingIds.has(caseId))
    .map((caseId) => {
      const entry = byCaseId.get(caseId)!;
      return {
        id: uuidv7(),
        test_run_id: runId,
        test_case_id: caseId,
        status: 'untested' as const,
        source_type: entry.sourceType,
        source_id: entry.sourceId,
        created_at: now,
        updated_at: now,
      };
    });
  if (created.length > 0) await db.insert(testCaseRuns).values(created);

  return restored.length + created.length;
}

/** 제외되지 않은 케이스 결과로 실행 상태를 정한다. 케이스가 없으면 시작 전으로 본다. */
export function deriveTestRunStatus(statuses: string[]): TestRunStatus {
  const untested = statuses.filter((status) => status === 'untested').length;
  if (statuses.length === 0 || untested === statuses.length) return 'NOT_STARTED';
  if (untested === 0) return 'COMPLETED';
  return 'IN_PROGRESS';
}

/**
 * 실행 상태를 현재 범위 기준으로 다시 계산한다.
 * 결과 입력뿐 아니라 스위트 제거·추가, 동기화, 케이스 삭제·복원처럼 범위가 바뀌는 곳마다 호출한다 (#376).
 */
export async function recomputeTestRunStatus(db: Executor, testRunIds: string | string[]) {
  const ids = [...new Set(Array.isArray(testRunIds) ? testRunIds : [testRunIds])];
  if (ids.length === 0) return;

  const rows = await db
    .select({ runId: testCaseRuns.test_run_id, status: testCaseRuns.status })
    .from(testCaseRuns)
    .where(and(inArray(testCaseRuns.test_run_id, ids), isNull(testCaseRuns.excluded_at)));

  const statusesByRun = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const row of rows) {
    if (row.runId) statusesByRun.get(row.runId)?.push(row.status);
  }

  const now = new Date();
  for (const [runId, statuses] of statusesByRun) {
    const status = deriveTestRunStatus(statuses);
    await db
      .update(testRuns)
      .set({ status, updated_at: now })
      .where(and(eq(testRuns.id, runId), ne(testRuns.status, status)));
  }
}

/**
 * 휴지통으로 간 케이스를 완료되지 않은 실행에서 뺀다 (#377).
 * 제외 시각을 케이스의 archived_at 과 같게 남겨, 복원할 때 이 삭제로 빠진 행만 되돌린다.
 * 완료된 실행은 기록으로 남기기 위해 건드리지 않는다.
 */
export async function excludeArchivedCasesFromRuns(
  db: Executor,
  caseIds: string[],
  archivedAt: Date
) {
  if (caseIds.length === 0) return;

  const affected = await db
    .update(testCaseRuns)
    .set({ excluded_at: archivedAt, updated_at: archivedAt })
    .where(
      and(
        inArray(testCaseRuns.test_case_id, caseIds),
        isNull(testCaseRuns.excluded_at),
        inArray(
          testCaseRuns.test_run_id,
          db.select({ id: testRuns.id }).from(testRuns).where(ne(testRuns.status, 'COMPLETED'))
        )
      )
    )
    .returning({ runId: testCaseRuns.test_run_id });

  await recomputeTestRunStatus(
    db,
    affected.map((row) => row.runId).filter((id): id is string => !!id)
  );
}

/** excludeArchivedCasesFromRuns 로 빠진 행을 케이스 복원 때 되돌린다. */
export async function restoreArchivedCasesToRuns(
  db: Executor,
  caseIds: string[],
  archivedAt: Date
) {
  if (caseIds.length === 0) return;

  const affected = await db
    .update(testCaseRuns)
    .set({ excluded_at: null, updated_at: new Date() })
    .where(
      and(inArray(testCaseRuns.test_case_id, caseIds), eq(testCaseRuns.excluded_at, archivedAt))
    )
    .returning({ runId: testCaseRuns.test_run_id });

  await recomputeTestRunStatus(
    db,
    affected.map((row) => row.runId).filter((id): id is string => !!id)
  );
}
