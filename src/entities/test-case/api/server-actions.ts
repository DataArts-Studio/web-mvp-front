'use server';

import * as Sentry from '@sentry/nextjs';
import { CreateTestCase, TestCase, TestCaseDTO, toCreateTestCaseDTO, toTestCase } from '@/entities';
import { getDatabase, testCases } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';











type getTestCasesParams = {
  project_id: string;
  limits?: { offset: number; limit: number };
};

export const getTestCases = async ({
  project_id,
  limits = { offset: 0, limit: 10 },
}: getTestCasesParams): Promise<ActionResult<TestCase[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testCases)
      .where(
        and(
          eq(testCases.project_id, project_id),
          eq(testCases.lifecycle_status, 'ACTIVE')
        )
      );
    if (!rows)
      return { success: false, errors: { _testCase: ['테스트 케이스가 존재하지 않습니다.'] } };

    const result: TestCase[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      testSuiteId: row.test_suite_id ?? undefined,
      displayId: row.display_id ?? 0,
      caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      preCondition: row.pre_condition ?? '',
      testSteps: row.steps ?? '',
      expectedResult: row.expected_result ?? '',
      sortOrder: row.sort_order ?? 0,
      resultStatus: row.result_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at ?? null,
      lifecycleStatus: row.lifecycle_status,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCases' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestCase = async (id: string): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(testCases)
      .where(
        and(
          eq(testCases.id, id),
          eq(testCases.lifecycle_status, 'ACTIVE')
        )
      );

    if (!row) {
      return {
        success: false,
        errors: { _testCase: ['테스트 케이스를 찾을 수 없습니다.'] },
      };
    }

    const result: TestCase = {
      id: row.id,
      projectId: row.project_id ?? '',
      testSuiteId: row.test_suite_id ?? undefined,
      displayId: row.display_id ?? 0,
      caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      preCondition: row.pre_condition ?? '',
      testSteps: row.steps ?? '',
      expectedResult: row.expected_result ?? '',
      sortOrder: row.sort_order ?? 0,
      resultStatus: row.result_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at ?? null,
      lifecycleStatus: row.lifecycle_status,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const createTestCase = async (input: CreateTestCase): Promise<ActionResult<TestCase>> => {
  try {
    const hasAccess = await requireProjectAccess(input.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(input.projectId);
    if (storageError) return storageError;

    const db = getDatabase();
    const dto = toCreateTestCaseDTO(input);
    const id = uuidv7();

    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
      .from(testCases)
      .where(eq(testCases.project_id, input.projectId));
    const nextDisplayId = (maxResult?.max ?? 0) + 1;

    const [inserted] = await db
      .insert(testCases)
      .values({
        id,
        ...dto,
        display_id: nextDisplayId,
        case_key: `TC-${String(nextDisplayId).padStart(3, '0')}`,
        result_status: 'untested',
        created_at: new Date(),
        updated_at: new Date(),
        archived_at: null,
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    const result: TestCase = toTestCase(inserted as TestCaseDTO);

    return {
      success: true,
      data: result,
      message: '테스트 케이스를 생성하였습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

type UpdateTestCaseParams = {
  id: string;
  title?: string;
  testSuiteId?: string | null;
  testType?: string;
  tags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};

export const updateTestCase = async (
  params: UpdateTestCaseParams
): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = params;

    // 접근 권한 확인: 대상 리소스의 프로젝트 ID 조회 후 검증
    const [existing] = await db.select({ projectId: testCases.project_id }).from(testCases).where(eq(testCases.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(existing.projectId);
    if (storageError) return storageError;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      updateData.name = updateFields.title;
    }
    if (updateFields.testSuiteId !== undefined) {
      updateData.test_suite_id = updateFields.testSuiteId;
    }
    if (updateFields.testType !== undefined) {
      updateData.test_type = updateFields.testType;
    }
    if (updateFields.tags !== undefined) {
      updateData.tags = updateFields.tags;
    }
    if (updateFields.preCondition !== undefined) {
      updateData.pre_condition = updateFields.preCondition;
    }
    if (updateFields.testSteps !== undefined) {
      updateData.steps = updateFields.testSteps;
    }
    if (updateFields.expectedResult !== undefined) {
      updateData.expected_result = updateFields.expectedResult;
    }
    if (updateFields.sortOrder !== undefined) {
      updateData.sort_order = updateFields.sortOrder;
    }

    const [updated] = await db
      .update(testCases)
      .set(updateData)
      .where(eq(testCases.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 찾을 수 없습니다.'] },
      };
    }

    const result: TestCase = toTestCase(updated as TestCaseDTO);

    return {
      success: true,
      data: result,
      message: '테스트케이스를 수정하였습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const archiveTestCase = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: testCases.project_id }).from(testCases).where(eq(testCases.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }

    const [archived] = await db
      .update(testCases)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'ARCHIVED',
        updated_at: new Date(),
      })
      .where(eq(testCases.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 찾을 수 없습니다.'] },
      }
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '테스트케이스가 성공적으로 삭제되었습니다.',
    }
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트 케이스를 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};