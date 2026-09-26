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

export type SnapshotData = {
  name: string;
  test_type?: string | null;
  tags?: string[] | null;
  pre_condition?: string | null;
  steps?: string | null;
  expected_result?: string | null;
};

export async function createVersionSnapshot(
  testCaseId: string,
  snapshotData: SnapshotData,
  changeType: ChangeType,
  changedFields: string[],
  changeSummary: string
): Promise<void> {
  const db = getDatabase();
  const id = uuidv7();

  const [maxResult] = await db
    .select({ max: sql<number>`COALESCE(MAX(${testCaseVersions.version_number}), 0)` })
    .from(testCaseVersions)
    .where(eq(testCaseVersions.test_case_id, testCaseId));

  const nextVersion = (maxResult?.max ?? 0) + 1;

  await db.insert(testCaseVersions).values({
    id,
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
