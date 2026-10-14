/**
 * 새로 만든 케이스의 후속 기록 (서버 전용 헬퍼).
 *
 * 직접 생성·복사·가져오기·AI 생성·체크리스트 변환이 모두 케이스를 넣은 같은 트랜잭션에서 이 함수를
 * 불러, 생성 경로와 무관하게 v1 버전이 남고 연결된 실행 동기화 규칙이 같게 한다 (#391).
 * 'use server' 파일에 두면 클라이언트가 임의 케이스에 직접 부를 수 있는 액션이 되므로 분리해 둔다.
 */
import {
  type SnapshotData,
  createInitialVersions,
} from '@/entities/test-case-version/api/create-version-snapshot';
import { recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import {
  getDatabase,
  milestoneTestSuites,
  testCaseRuns,
  testCases,
  testRunSuites,
  testRuns,
} from '@testea/db';
import { and, eq, inArray, ne } from 'drizzle-orm';
import 'server-only';
import { v7 as uuidv7 } from 'uuid';

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type CaseRow = typeof testCases.$inferSelect;

/** 버전에 남기는 케이스 내용. */
export const toSnapshot = (row: CaseRow): SnapshotData => ({
  name: row.name,
  test_type: row.test_type,
  tags: row.tags,
  pre_condition: row.pre_condition,
  steps: row.steps,
  expected_result: row.expected_result,
});

/** 새 케이스들의 v1 버전을 남기고, 스위트에 연결된 실행에 케이스를 넣는다. */
export async function recordCreatedCases(
  tx: Transaction,
  rows: CaseRow[],
  changeSummary: string
): Promise<void> {
  if (rows.length === 0) return;

  await createInitialVersions(
    rows.map((row) => ({ testCaseId: row.id, snapshot: toSnapshot(row) })),
    changeSummary,
    tx
  );

  const caseIdsBySuite = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.test_suite_id) continue;
    const ids = caseIdsBySuite.get(row.test_suite_id) ?? [];
    ids.push(row.id);
    caseIdsBySuite.set(row.test_suite_id, ids);
  }
  for (const [suiteId, caseIds] of caseIdsBySuite) {
    await syncCasesToLinkedRuns(tx, caseIds, suiteId);
  }
}

/**
 * 케이스가 스위트에 추가될 때, 해당 스위트가 연결된 테스트 실행들에 케이스를 동기화합니다.
 * 생성뿐 아니라 케이스를 다른 스위트로 옮길 때도 부른다.
 * 1) test_run_suites 직접 링크
 * 2) 마일스톤 체인: suite → milestone_test_suites → milestone → test_runs
 */
export async function syncCasesToLinkedRuns(db: Transaction, caseIds: string[], suiteId: string) {
  // 1. test_run_suites 직접 링크로 연결된 런. 실행에서 제거한 스위트는 건너뛴다 (#375).
  const suiteLinks = await db
    .select({ test_run_id: testRunSuites.test_run_id, excluded_at: testRunSuites.excluded_at })
    .from(testRunSuites)
    .where(eq(testRunSuites.test_suite_id, suiteId));
  const excludedRunIds = new Set(
    suiteLinks.filter((link) => link.excluded_at).map((link) => link.test_run_id)
  );

  // 2. 마일스톤 체인으로 연결된 런
  const msRows = await db
    .select({ milestone_id: milestoneTestSuites.milestone_id })
    .from(milestoneTestSuites)
    .where(eq(milestoneTestSuites.test_suite_id, suiteId));

  const milestoneIds = msRows.map((r) => r.milestone_id).filter(Boolean) as string[];

  let milestoneRuns: { id: string }[] = [];
  if (milestoneIds.length > 0) {
    milestoneRuns = await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(inArray(testRuns.milestone_id, milestoneIds));
  }

  // 합치고 중복 제거
  const candidateRunIds = new Set<string>();
  for (const r of suiteLinks) {
    if (r.test_run_id && !excludedRunIds.has(r.test_run_id)) candidateRunIds.add(r.test_run_id);
  }
  for (const r of milestoneRuns) {
    if (!excludedRunIds.has(r.id)) candidateRunIds.add(r.id);
  }

  if (candidateRunIds.size === 0) return;

  // 완료되었거나 삭제된 실행은 기록으로 두고 범위를 바꾸지 않는다 (#376).
  const openRuns = await db
    .select({ id: testRuns.id })
    .from(testRuns)
    .where(
      and(
        inArray(testRuns.id, Array.from(candidateRunIds)),
        ne(testRuns.status, 'COMPLETED'),
        eq(testRuns.lifecycle_status, 'ACTIVE')
      )
    );
  const runIds = openRuns.map((r) => r.id);

  if (runIds.length === 0) return;

  // 마일스톤 체인으로 찾은 런에 test_run_suites 엔트리가 없으면 생성
  const existingRunSuiteIds = new Set(suiteLinks.map((r) => r.test_run_id));
  const missingRunSuiteIds = runIds.filter((id) => !existingRunSuiteIds.has(id));

  if (missingRunSuiteIds.length > 0) {
    await db
      .insert(testRunSuites)
      .values(
        missingRunSuiteIds.map((runId) => ({
          test_run_id: runId,
          test_suite_id: suiteId,
        }))
      )
      .onConflictDoNothing();
  }

  // 이미 등록된 케이스런 확인 (중복 방지)
  const existingRows = await db
    .select({ test_run_id: testCaseRuns.test_run_id, test_case_id: testCaseRuns.test_case_id })
    .from(testCaseRuns)
    .where(
      and(inArray(testCaseRuns.test_run_id, runIds), inArray(testCaseRuns.test_case_id, caseIds))
    );
  const existingPairs = new Set(existingRows.map((r) => `${r.test_run_id}:${r.test_case_id}`));

  const now = new Date();
  const newCaseRuns = runIds.flatMap((runId) =>
    caseIds
      .filter((caseId) => !existingPairs.has(`${runId}:${caseId}`))
      .map((caseId) => ({
        id: uuidv7(),
        test_run_id: runId,
        test_case_id: caseId,
        status: 'untested' as const,
        source_type: 'suite' as const,
        source_id: suiteId,
        created_at: now,
        updated_at: now,
      }))
  );

  if (newCaseRuns.length === 0) return;

  await db.insert(testCaseRuns).values(newCaseRuns);
  await recomputeTestRunStatus(db, [...new Set(newCaseRuns.map((r) => r.test_run_id))]);
}
