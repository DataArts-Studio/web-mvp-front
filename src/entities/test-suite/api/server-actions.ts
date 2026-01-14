'use server';

import type { CreateTestSuite, TestSuite } from '@/entities/test-suite';
import { toCreateTestSuiteDTO } from '@/entities/test-suite/model/mapper';
import { getDatabase, testSuites } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

type GetTestSuitesParams = {
  projectId: string;
  limits?: { offset: number; limit: number };
};

export const createTestSuite = async (input: CreateTestSuite): Promise<ActionResult<TestSuite>> => {
  try {
    const db = getDatabase();
    const dto = toCreateTestSuiteDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(testSuites)
      .values({
        id,
        project_id: dto.project_id,
        name: dto.name,
        description: dto.description,
        sort_order: dto.sort_order,
        created_at: new Date(),
        updated_at: new Date(),
        archived_at: null,
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    const result: TestSuite = {
      id: inserted.id,
      projectId: inserted.project_id ?? '',
      title: inserted.name,
      description: inserted.description ?? undefined,
      sortOrder: inserted.sort_order ?? 0,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
      archivedAt: inserted.archived_at ?? null,
      lifecycleStatus: inserted.lifecycle_status,
    };

    return {
      success: true,
      data: result,
      message: '테스트 스위트를 생성하였습니다.',
    };
  } catch (error) {
    console.error('Error creating test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestSuites = async ({
  projectId,
  limits = { offset: 0, limit: 10 },
}: GetTestSuitesParams): Promise<ActionResult<TestSuite[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testSuites)
      .where(
        and(
          eq(testSuites.project_id, projectId),
          eq(testSuites.lifecycle_status, 'ACTIVE')
        )
      )
      .limit(limits.limit)
      .offset(limits.offset);

    if (!rows) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트가 존재하지 않습니다.'] },
      };
    }

    const result: TestSuite[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      title: row.name,
      description: row.description ?? undefined,
      sortOrder: row.sort_order ?? 0,
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
    console.error('Error fetching test suites:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestSuiteById = async (id: string): Promise<ActionResult<TestSuite>> => {
  try {
    const db = getDatabase();
    const [row] = await db.select().from(testSuites).where(eq(testSuites.id, id));

    if (!row) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    const result: TestSuite = {
      id: row.id,
      projectId: row.project_id ?? '',
      title: row.name,
      description: row.description ?? undefined,
      sortOrder: row.sort_order ?? 0,
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
    console.error('Error fetching test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

type UpdateTestSuiteParams = {
  id: string;
  title?: string;
  description?: string;
  sortOrder?: number;
};

export const updateTestSuite = async (params: UpdateTestSuiteParams): Promise<ActionResult<TestSuite>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = params;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      updateData.name = updateFields.title;
    }
    if (updateFields.description !== undefined) {
      updateData.description = updateFields.description;
    }
    if (updateFields.sortOrder !== undefined) {
      updateData.sort_order = updateFields.sortOrder;
    }

    const [updated] = await db
      .update(testSuites)
      .set(updateData)
      .where(eq(testSuites.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    const result: TestSuite = {
      id: updated.id,
      projectId: updated.project_id ?? '',
      title: updated.name,
      description: updated.description ?? undefined,
      sortOrder: updated.sort_order ?? 0,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      archivedAt: updated.archived_at ?? null,
      lifecycleStatus: updated.lifecycle_status,
    };

    return {
      success: true,
      data: result,
      message: '테스트 스위트를 수정하였습니다.',
    };
  } catch (error) {
    console.error('Error updating test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 테스트 스위트를 아카이브합니다. (Soft Delete)
 */
export const archiveTestSuite = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    const [archived] = await db
      .update(testSuites)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'ARCHIVED',
        updated_at: new Date(),
      })
      .where(eq(testSuites.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '테스트 스위트를 아카이브하였습니다.',
    };
  } catch (error) {
    console.error('Error archiving test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 아카이브하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * @deprecated Use archiveTestSuite instead
 */
export const deleteTestSuite = archiveTestSuite;