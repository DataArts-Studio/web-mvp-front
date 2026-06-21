'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases, testSuites } from '@testea/db';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { SORT_ORDER_GAP } from '../model/sort-utils';

const accessDenied = (): ActionResult<void> => ({
  success: false,
  errors: { _form: ['접근 권한이 없습니다.'] },
});

const targetNotFound = (): ActionResult<void> => ({
  success: false,
  errors: { _form: ['대상을 찾을 수 없습니다.'] },
});

/**
 * 테스트 케이스 sort_order 업데이트.
 * id 로 소유 프로젝트를 확인하고 requireProjectAccess 로 가드한다(IDOR 방지).
 */
export async function reorderTestCase(
  id: string,
  newSortOrder: number
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();

    const [row] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, id))
      .limit(1);
    if (!row?.projectId || !(await requireProjectAccess(row.projectId))) return accessDenied();

    await db
      .update(testCases)
      .set({ sort_order: newSortOrder, updated_at: new Date() })
      .where(and(eq(testCases.id, id), eq(testCases.project_id, row.projectId)));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderTestCase' } });
    return { success: false, errors: { _form: ['순서 변경에 실패했습니다.'] } };
  }
}

/**
 * 테스트 스위트 sort_order 업데이트. id 소유 프로젝트로 가드.
 */
export async function reorderTestSuite(
  id: string,
  newSortOrder: number
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();

    const [row] = await db
      .select({ projectId: testSuites.project_id })
      .from(testSuites)
      .where(eq(testSuites.id, id))
      .limit(1);
    if (!row?.projectId || !(await requireProjectAccess(row.projectId))) return accessDenied();

    await db
      .update(testSuites)
      .set({ sort_order: newSortOrder, updated_at: new Date() })
      .where(and(eq(testSuites.id, id), eq(testSuites.project_id, row.projectId)));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderTestSuite' } });
    return { success: false, errors: { _form: ['순서 변경에 실패했습니다.'] } };
  }
}

/**
 * TC를 다른 스위트로 이동. caseId 소유 프로젝트로 가드하고,
 * 대상 스위트(newSuiteId)도 같은 프로젝트 소속인지 검증(cross-project 이동 차단).
 */
export async function moveTestCaseToSuite(
  caseId: string,
  newSuiteId: string | null
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();

    const [caseRow] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, caseId))
      .limit(1);
    if (!caseRow?.projectId || !(await requireProjectAccess(caseRow.projectId)))
      return accessDenied();
    const projectId = caseRow.projectId;

    // 대상 스위트가 같은 프로젝트 소속인지 확인 (다른 프로젝트 스위트로 끌어가지 못하게)
    if (newSuiteId) {
      const [suiteRow] = await db
        .select({ id: testSuites.id })
        .from(testSuites)
        .where(and(eq(testSuites.id, newSuiteId), eq(testSuites.project_id, projectId)))
        .limit(1);
      if (!suiteRow) return targetNotFound();
    }

    // 새 스위트의 마지막 sort_order 조회 (같은 프로젝트 범위 내)
    const conditions = [
      eq(testCases.project_id, projectId),
      eq(testCases.lifecycle_status, 'ACTIVE'),
    ];
    if (newSuiteId) {
      conditions.push(eq(testCases.test_suite_id, newSuiteId));
    }

    const lastCase = await db
      .select({ sort_order: testCases.sort_order })
      .from(testCases)
      .where(and(...conditions))
      .orderBy(asc(testCases.sort_order))
      .limit(1);

    const maxOrder =
      lastCase.length > 0 && lastCase[0].sort_order
        ? lastCase[0].sort_order + SORT_ORDER_GAP
        : SORT_ORDER_GAP;

    await db
      .update(testCases)
      .set({
        test_suite_id: newSuiteId,
        sort_order: maxOrder,
        updated_at: new Date(),
      })
      .where(and(eq(testCases.id, caseId), eq(testCases.project_id, projectId)));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'moveTestCaseToSuite' } });
    return { success: false, errors: { _form: ['스위트 이동에 실패했습니다.'] } };
  }
}

/**
 * sort_order 전체 재정렬 (rebalance)
 * @param entityType - 'testCase' | 'testSuite'
 * @param scopeId - testCase 면 suiteId, testSuite 면 projectId
 *
 * scope 의 소유 프로젝트로 가드하고, orderedIds 가 모두 그 프로젝트 소속인지 확인한 뒤
 * 프로젝트 범위로만 UPDATE 한다(임의 id 일괄 갱신 차단).
 */
export async function rebalanceSortOrder(
  entityType: 'testCase' | 'testSuite',
  scopeId: string,
  orderedIds: string[]
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();
    const uniqueIds = [...new Set(orderedIds)];

    if (entityType === 'testCase') {
      // scopeId = suiteId → 그 스위트의 프로젝트로 가드
      const [suiteRow] = await db
        .select({ projectId: testSuites.project_id })
        .from(testSuites)
        .where(eq(testSuites.id, scopeId))
        .limit(1);
      if (!suiteRow?.projectId || !(await requireProjectAccess(suiteRow.projectId)))
        return accessDenied();
      const projectId = suiteRow.projectId;

      if (uniqueIds.length > 0) {
        const owned = await db
          .select({ id: testCases.id })
          .from(testCases)
          .where(and(inArray(testCases.id, uniqueIds), eq(testCases.project_id, projectId)));
        if (owned.length !== uniqueIds.length) return targetNotFound();
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(testCases)
          .set({ sort_order: (i + 1) * SORT_ORDER_GAP })
          .where(and(eq(testCases.id, orderedIds[i]), eq(testCases.project_id, projectId)));
      }
    } else {
      // scopeId = projectId
      if (!(await requireProjectAccess(scopeId))) return accessDenied();

      if (uniqueIds.length > 0) {
        const owned = await db
          .select({ id: testSuites.id })
          .from(testSuites)
          .where(and(inArray(testSuites.id, uniqueIds), eq(testSuites.project_id, scopeId)));
        if (owned.length !== uniqueIds.length) return targetNotFound();
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(testSuites)
          .set({ sort_order: (i + 1) * SORT_ORDER_GAP })
          .where(and(eq(testSuites.id, orderedIds[i]), eq(testSuites.project_id, scopeId)));
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, {
      extra: { action: 'rebalanceSortOrder', entityType, scopeId },
    });
    return { success: false, errors: { _form: ['재정렬에 실패했습니다.'] } };
  }
}

/**
 * 스위트 내 TC의 sort_order 초기화 (null → 1000 간격). projectId 로 가드.
 */
export async function initializeSortOrders(
  projectId: string,
  suiteId?: string
): Promise<ActionResult<void>> {
  try {
    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const db = getDatabase();

    const conditions = [
      eq(testCases.project_id, projectId),
      eq(testCases.lifecycle_status, 'ACTIVE'),
    ];

    if (suiteId) {
      conditions.push(eq(testCases.test_suite_id, suiteId));
    }

    const rows = await db
      .select({ id: testCases.id })
      .from(testCases)
      .where(and(...conditions))
      .orderBy(asc(testCases.created_at));

    for (let i = 0; i < rows.length; i++) {
      await db
        .update(testCases)
        .set({ sort_order: (i + 1) * SORT_ORDER_GAP })
        .where(and(eq(testCases.id, rows[i].id), eq(testCases.project_id, projectId)));
    }

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'initializeSortOrders' } });
    return { success: false, errors: { _form: ['정렬 초기화에 실패했습니다.'] } };
  }
}
