'use server';

import { CreateTestCase, TestCase, TestCaseDTO, toCreateTestCaseDTO, toTestCase } from '@/entities';
import type { ActionResult } from '@/shared/types';
import { getDatabase, testCases } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

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
    const rows = await db.select().from(testCases).where(eq(testCases.project_id, project_id));
    if (!rows)
      return { success: false, errors: { _testCase: ['테스트 케이스가 존재하지 않습니다.'] } };

    const result: TestCase[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      caseKey: row.case_key ?? '',
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      preCondition: row.pre_condition ?? '',
      testSteps: row.steps ?? '',
      expectedResult: row.expected_result ?? '',
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? null,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestCase = async () => {
  try {
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error fetching test case: ', error);
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const createTestCase = async (input: CreateTestCase): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const dto = toCreateTestCaseDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(testCases)
      .values({ id, ...dto, created_at: new Date(), updated_at: new Date(), deleted_at: null })
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
    console.error('Error creating test case:', error);
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

type UpdateTestCaseParams = {
  id: string;
  title?: string;
  testType?: string;
  tags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};

export const updateTestCase = async (params: UpdateTestCaseParams): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = params;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      updateData.name = updateFields.title;
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
    console.error('Error updating test case:', error);
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};
