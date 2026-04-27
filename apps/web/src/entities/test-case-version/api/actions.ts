'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases, testCaseVersions } from '@testea/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql, desc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import type { ChangeType, TestCaseVersion, VersionCompareResult } from '../model/types';
import type { TestCaseVersionDTO } from '../model/schema';
import { toTestCaseVersion, toTestCaseVersionSummary } from '../model/mapper';
import { computeFieldDiffs, detectChangedFields, generateChangeSummary } from '../model/diff-utils';
import type { TestCase } from '@/entities/test-case/model/types';
import { toTestCase } from '@/entities/test-case/model/mapper';
import type { TestCaseDTO } from '@/entities/test-case/model/types';

type SnapshotData = {
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

export async function getVersionsByTestCaseId(
  testCaseId: string,
  limit = 50,
  offset = 0
): Promise<ActionResult<{ versions: ReturnType<typeof toTestCaseVersionSummary>[]; total: number }>> {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [tc] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);
    if (!tc?.projectId || !(await requireProjectAccess(tc.projectId))) {
      return { success: false, errors: { _version: ['접근 권한이 없습니다.'] } };
    }

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(testCaseVersions)
      .where(eq(testCaseVersions.test_case_id, testCaseId));

    const rows = await db
      .select()
      .from(testCaseVersions)
      .where(eq(testCaseVersions.test_case_id, testCaseId))
      .orderBy(desc(testCaseVersions.version_number))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        versions: rows.map((row) => toTestCaseVersionSummary(row as TestCaseVersionDTO)),
        total: Number(countResult?.count ?? 0),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getVersionsByTestCaseId' } });
    return { success: false, errors: { _version: ['버전 목록을 불러오는 도중 오류가 발생했습니다.'] } };
  }
}

export async function getVersionDetail(
  testCaseId: string,
  versionNumber: number
): Promise<ActionResult<TestCaseVersion>> {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [tc] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);
    if (!tc?.projectId || !(await requireProjectAccess(tc.projectId))) {
      return { success: false, errors: { _version: ['접근 권한이 없습니다.'] } };
    }

    const [row] = await db
      .select()
      .from(testCaseVersions)
      .where(
        and(
          eq(testCaseVersions.test_case_id, testCaseId),
          eq(testCaseVersions.version_number, versionNumber)
        )
      )
      .limit(1);

    if (!row) {
      return { success: false, errors: { _version: ['해당 버전을 찾을 수 없습니다.'] } };
    }

    return {
      success: true,
      data: toTestCaseVersion(row as TestCaseVersionDTO),
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getVersionDetail' } });
    return { success: false, errors: { _version: ['버전 상세를 불러오는 도중 오류가 발생했습니다.'] } };
  }
}

export async function compareVersions(
  testCaseId: string,
  oldVersionNumber: number,
  newVersionNumber: number
): Promise<ActionResult<VersionCompareResult>> {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [tc] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);
    if (!tc?.projectId || !(await requireProjectAccess(tc.projectId))) {
      return { success: false, errors: { _version: ['접근 권한이 없습니다.'] } };
    }

    const rows = await db
      .select()
      .from(testCaseVersions)
      .where(
        and(
          eq(testCaseVersions.test_case_id, testCaseId),
          sql`${testCaseVersions.version_number} IN (${oldVersionNumber}, ${newVersionNumber})`
        )
      );

    const oldRow = rows.find((r) => r.version_number === oldVersionNumber);
    const newRow = rows.find((r) => r.version_number === newVersionNumber);

    if (!oldRow || !newRow) {
      return { success: false, errors: { _version: ['비교할 버전을 찾을 수 없습니다.'] } };
    }

    const oldVersion = toTestCaseVersion(oldRow as TestCaseVersionDTO);
    const newVersion = toTestCaseVersion(newRow as TestCaseVersionDTO);
    const diffs = computeFieldDiffs(oldVersion, newVersion);

    return {
      success: true,
      data: { oldVersion, newVersion, diffs },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'compareVersions' } });
    return { success: false, errors: { _version: ['버전 비교 도중 오류가 발생했습니다.'] } };
  }
}

export async function rollbackToVersion(
  testCaseId: string,
  targetVersionNumber: number
): Promise<ActionResult<TestCase>> {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [tc] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);
    if (!tc?.projectId || !(await requireProjectAccess(tc.projectId))) {
      return { success: false, errors: { _version: ['접근 권한이 없습니다.'] } };
    }

    // 복원 대상 버전 조회
    const [targetRow] = await db
      .select()
      .from(testCaseVersions)
      .where(
        and(
          eq(testCaseVersions.test_case_id, testCaseId),
          eq(testCaseVersions.version_number, targetVersionNumber)
        )
      )
      .limit(1);

    if (!targetRow) {
      return { success: false, errors: { _version: ['복원할 버전을 찾을 수 없습니다.'] } };
    }

    // 현재 데이터로 스냅샷 먼저 생성 (현재 상태 보존)
    const [currentRow] = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);

    if (currentRow) {
      const currentSnapshot = {
        name: currentRow.name,
        test_type: currentRow.test_type,
        tags: currentRow.tags,
        pre_condition: currentRow.pre_condition,
        steps: currentRow.steps,
        expected_result: currentRow.expected_result,
      };

      const targetSnapshot = {
        name: targetRow.name,
        test_type: targetRow.test_type,
        tags: targetRow.tags as string[] | null,
        pre_condition: targetRow.pre_condition,
        steps: targetRow.steps,
        expected_result: targetRow.expected_result,
      };

      const changedFields = detectChangedFields(currentSnapshot, targetSnapshot);
      const changeSummary = generateChangeSummary(changedFields, 'rollback');

      // 테스트케이스 업데이트
      const [updated] = await db
        .update(testCases)
        .set({
          name: targetRow.name,
          test_type: targetRow.test_type,
          tags: targetRow.tags as string[] | null,
          pre_condition: targetRow.pre_condition,
          steps: targetRow.steps,
          expected_result: targetRow.expected_result,
          updated_at: new Date(),
        })
        .where(eq(testCases.id, testCaseId))
        .returning();

      if (!updated) {
        return { success: false, errors: { _version: ['복원 도중 오류가 발생했습니다.'] } };
      }

      // 롤백 버전 스냅샷 생성
      await createVersionSnapshot(
        testCaseId,
        targetSnapshot,
        'rollback',
        changedFields,
        changeSummary
      );

      const result = toTestCase(updated as TestCaseDTO);
      return { success: true, data: result, message: `v${targetVersionNumber}으로 복원되었습니다.` };
    }

    return { success: false, errors: { _version: ['테스트케이스를 찾을 수 없습니다.'] } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'rollbackToVersion' } });
    return { success: false, errors: { _version: ['버전 복원 도중 오류가 발생했습니다.'] } };
  }
}
