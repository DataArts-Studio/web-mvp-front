/**
 * 테스트 케이스 버전 스냅샷 기록 (서버 전용 헬퍼).
 *
 * 권한 검증을 마친 서버 액션(케이스 생성·수정·복제·롤백) 내부에서만 호출한다.
 * 'use server' 파일에 두면 클라이언트가 임의 케이스에 버전을 직접 쓸 수 있는 액션으로
 * 노출되므로, 서버 액션 모듈과 분리해 둔다.
 */
import { getDatabase, testCaseVersions } from '@testea/db';
import { eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

import type { ChangeType } from '../model/types';

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export type SnapshotData = {
  name: string;
  test_type?: string | null;
  tags?: string[] | null;
  pre_condition?: string | null;
  steps?: string | null;
  expected_result?: string | null;
};

/**
 * 케이스 변경과 같은 트랜잭션에서 기록하려면 tx 를 넘긴다. 그러면 케이스 저장과 버전 기록이
 * 함께 반영되거나 함께 취소된다 (#390). 넘기지 않으면 자체 트랜잭션을 연다.
 */
export async function createVersionSnapshot(
  testCaseId: string,
  snapshotData: SnapshotData,
  changeType: ChangeType,
  changedFields: string[],
  changeSummary: string,
  tx?: Transaction
): Promise<void> {
  if (!tx) {
    await getDatabase().transaction((own) =>
      createVersionSnapshot(testCaseId, snapshotData, changeType, changedFields, changeSummary, own)
    );
    return;
  }

  // 다음 버전 번호를 "최댓값 + 1" 로 정하므로, 같은 케이스를 동시에 저장해도 번호가 겹쳐
  // 유니크 제약에 걸리지 않게 케이스 단위로 잠근 뒤 세고 넣는다 (#390).
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext('case_version_number'), hashtext(${testCaseId}))`
  );
  const [maxResult] = await tx
    .select({ max: sql<number>`COALESCE(MAX(${testCaseVersions.version_number}), 0)` })
    .from(testCaseVersions)
    .where(eq(testCaseVersions.test_case_id, testCaseId));

  const nextVersion = (maxResult?.max ?? 0) + 1;

  await tx.insert(testCaseVersions).values({
    id: uuidv7(),
    test_case_id: testCaseId,
    version_number: nextVersion,
    name: snapshotData.name,
    test_type: snapshotData.test_type ?? null,
    tags: snapshotData.tags ?? [],
    pre_condition: snapshotData.pre_condition ?? null,
    steps: snapshotData.steps ?? null,
    expected_result: snapshotData.expected_result ?? null,
    change_summary: changeSummary,
    change_type: changeType,
    changed_fields: changedFields,
    created_at: new Date(),
  });
}

/**
 * 방금 만든 케이스들의 v1 버전을 한 번에 기록한다 (#391).
 * 새 케이스에는 아직 버전이 없으므로 번호를 세거나 잠그지 않고 1 로 넣는다.
 * 케이스 삽입과 같은 트랜잭션의 tx 를 넘겨 함께 반영되거나 함께 취소되게 한다.
 */
export async function createInitialVersions(
  entries: { testCaseId: string; snapshot: SnapshotData }[],
  changeSummary: string,
  tx: Transaction
): Promise<void> {
  if (entries.length === 0) return;

  const now = new Date();
  await tx.insert(testCaseVersions).values(
    entries.map(({ testCaseId, snapshot }) => ({
      id: uuidv7(),
      test_case_id: testCaseId,
      version_number: 1,
      name: snapshot.name,
      test_type: snapshot.test_type ?? null,
      tags: snapshot.tags ?? [],
      pre_condition: snapshot.pre_condition ?? null,
      steps: snapshot.steps ?? null,
      expected_result: snapshot.expected_result ?? null,
      change_summary: changeSummary,
      change_type: 'create' as const,
      changed_fields: [],
      created_at: now,
    }))
  );
}
