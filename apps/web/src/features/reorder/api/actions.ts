'use server';

import * as Sentry from '@sentry/nextjs';
import { eq, and, asc } from 'drizzle-orm';

import { getDatabase, testCases, testSuites } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { SORT_ORDER_GAP } from '../model/sort-utils';

/**
 * 테스트 케이스 sort_order 업데이트
 */
export async function reorderTestCase(
  id: string,
  newSortOrder: number,
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();
    await db
      .update(testCases)
      .set({ sort_order: newSortOrder, updated_at: new Date() })
      .where(eq(testCases.id, id));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderTestCase' } });
    return { success: false, errors: { _form: ['순서 변경에 실패했습니다.'] } };
  }
}

/**
 * 테스트 스위트 sort_order 업데이트
 */
export async function reorderTestSuite(
  id: string,
  newSortOrder: number,
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();
    await db
      .update(testSuites)
      .set({ sort_order: newSortOrder, updated_at: new Date() })
      .where(eq(testSuites.id, id));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderTestSuite' } });
    return { success: false, errors: { _form: ['순서 변경에 실패했습니다.'] } };
  }
}

/**
 * TC를 다른 스위트로 이동
 */
export async function moveTestCaseToSuite(
  caseId: string,
  newSuiteId: string | null,
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();

    // 새 스위트의 마지막 sort_order 조회
    const conditions = [eq(testCases.lifecycle_status, 'ACTIVE')];
    if (newSuiteId) {
      conditions.push(eq(testCases.test_suite_id, newSuiteId));
    }

    const lastCase = await db
      .select({ sort_order: testCases.sort_order })
      .from(testCases)
      .where(and(...conditions))
      .orderBy(asc(testCases.sort_order))
      .limit(1);

    const maxOrder = lastCase.length > 0 && lastCase[0].sort_order
      ? lastCase[0].sort_order + SORT_ORDER_GAP
      : SORT_ORDER_GAP;

    await db
      .update(testCases)
      .set({
        test_suite_id: newSuiteId,
        sort_order: maxOrder,
        updated_at: new Date(),
      })
      .where(eq(testCases.id, caseId));

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'moveTestCaseToSuite' } });
    return { success: false, errors: { _form: ['스위트 이동에 실패했습니다.'] } };
  }
}

/**
 * sort_order 전체 재정렬 (rebalance)
 * @param entityType - 'testCase' | 'testSuite'
 * @param scopeId - projectId (스위트) 또는 suiteId (TC)
 */
export async function rebalanceSortOrder(
  entityType: 'testCase' | 'testSuite',
  scopeId: string,
  orderedIds: string[],
): Promise<ActionResult<void>> {
  try {
    const db = getDatabase();

    if (entityType === 'testCase') {
      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(testCases)
          .set({ sort_order: (i + 1) * SORT_ORDER_GAP })
          .where(eq(testCases.id, orderedIds[i]));
      }
    } else {
      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(testSuites)
          .set({ sort_order: (i + 1) * SORT_ORDER_GAP })
          .where(eq(testSuites.id, orderedIds[i]));
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'rebalanceSortOrder', entityType, scopeId } });
    return { success: false, errors: { _form: ['재정렬에 실패했습니다.'] } };
  }
}

/**
 * 스위트 내 TC의 sort_order 초기화 (null → 1000 간격)
 */
export async function initializeSortOrders(
  projectId: string,
  suiteId?: string,
): Promise<ActionResult<void>> {
  try {
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
        .where(eq(testCases.id, rows[i].id));
    }

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'initializeSortOrders' } });
    return { success: false, errors: { _form: ['정렬 초기화에 실패했습니다.'] } };
  }
}
