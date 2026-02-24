'use server';

import * as Sentry from '@sentry/nextjs';
import type { CreateTestCaseTemplate, TestCaseTemplate, TestCaseTemplateDTO, UpdateTestCaseTemplate } from '../model/types';
import { toCreateTemplateDTO, toTestCaseTemplate } from '../model/mapper';
import { BUILTIN_TEMPLATES, isBuiltinTemplate } from '../model/constants';
import { getDatabase, testCaseTemplates } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';
import { testCases } from '@/shared/lib/db';

export const getTemplatesByProjectId = async (
  projectId: string
): Promise<ActionResult<TestCaseTemplate[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testCaseTemplates)
      .where(
        and(
          eq(testCaseTemplates.project_id, projectId),
          eq(testCaseTemplates.lifecycle_status, 'ACTIVE')
        )
      );

    const customTemplates = rows.map((row) => toTestCaseTemplate(row as TestCaseTemplateDTO));
    const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

    return {
      success: true,
      data: allTemplates,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTemplatesByProjectId' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTemplateById = async (
  templateId: string
): Promise<ActionResult<TestCaseTemplate>> => {
  try {
    if (isBuiltinTemplate(templateId)) {
      const builtin = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
      if (!builtin) {
        return { success: false, errors: { _template: ['템플릿을 찾을 수 없습니다.'] } };
      }
      return { success: true, data: builtin };
    }

    const db = getDatabase();
    const [row] = await db
      .select()
      .from(testCaseTemplates)
      .where(
        and(
          eq(testCaseTemplates.id, templateId),
          eq(testCaseTemplates.lifecycle_status, 'ACTIVE')
        )
      );

    if (!row) {
      return { success: false, errors: { _template: ['템플릿을 찾을 수 없습니다.'] } };
    }

    return {
      success: true,
      data: toTestCaseTemplate(row as TestCaseTemplateDTO),
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTemplateById' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const createTemplate = async (
  input: CreateTestCaseTemplate
): Promise<ActionResult<TestCaseTemplate>> => {
  try {
    const hasAccess = await requireProjectAccess(input.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _template: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(input.projectId);
    if (storageError) return storageError;

    const db = getDatabase();
    const dto = toCreateTemplateDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(testCaseTemplates)
      .values({
        id,
        ...dto,
        category: 'CUSTOM',
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _template: ['템플릿을 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    return {
      success: true,
      data: toTestCaseTemplate(inserted as TestCaseTemplateDTO),
      message: '템플릿이 생성되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTemplate' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const createTemplateFromCase = async (
  caseId: string,
  name: string,
  description?: string
): Promise<ActionResult<TestCaseTemplate>> => {
  try {
    const db = getDatabase();

    const [testCase] = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, caseId));

    if (!testCase || !testCase.project_id) {
      return { success: false, errors: { _template: ['테스트 케이스를 찾을 수 없습니다.'] } };
    }

    const hasAccess = await requireProjectAccess(testCase.project_id);
    if (!hasAccess) {
      return { success: false, errors: { _template: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(testCase.project_id);
    if (storageError) return storageError;

    const id = uuidv7();

    const [inserted] = await db
      .insert(testCaseTemplates)
      .values({
        id,
        project_id: testCase.project_id,
        name,
        description: description ?? '',
        category: 'CUSTOM',
        test_type: testCase.test_type,
        default_tags: JSON.stringify(testCase.tags ?? []),
        pre_condition: testCase.pre_condition,
        test_steps: testCase.steps,
        expected_result: testCase.expected_result,
        usage_count: 0,
        sort_order: 0,
        created_at: new Date(),
        updated_at: new Date(),
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _template: ['템플릿을 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    return {
      success: true,
      data: toTestCaseTemplate(inserted as TestCaseTemplateDTO),
      message: '템플릿으로 저장되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTemplateFromCase' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const updateTemplate = async (
  input: UpdateTestCaseTemplate
): Promise<ActionResult<TestCaseTemplate>> => {
  try {
    if (isBuiltinTemplate(input.id)) {
      return { success: false, errors: { _template: ['빌트인 템플릿은 수정할 수 없습니다.'] } };
    }

    const db = getDatabase();

    const [existing] = await db
      .select()
      .from(testCaseTemplates)
      .where(eq(testCaseTemplates.id, input.id))
      .limit(1);

    if (!existing?.project_id || !(await requireProjectAccess(existing.project_id))) {
      return { success: false, errors: { _template: ['접근 권한이 없습니다.'] } };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.testType !== undefined) updateData.test_type = input.testType;
    if (input.defaultTags !== undefined) updateData.default_tags = JSON.stringify(input.defaultTags);
    if (input.preCondition !== undefined) updateData.pre_condition = input.preCondition;
    if (input.testSteps !== undefined) updateData.test_steps = input.testSteps;
    if (input.expectedResult !== undefined) updateData.expected_result = input.expectedResult;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    const [updated] = await db
      .update(testCaseTemplates)
      .set(updateData)
      .where(eq(testCaseTemplates.id, input.id))
      .returning();

    if (!updated) {
      return { success: false, errors: { _template: ['템플릿을 찾을 수 없습니다.'] } };
    }

    return {
      success: true,
      data: toTestCaseTemplate(updated as TestCaseTemplateDTO),
      message: '템플릿이 수정되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTemplate' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const deleteTemplate = async (
  templateId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    if (isBuiltinTemplate(templateId)) {
      return { success: false, errors: { _template: ['빌트인 템플릿은 삭제할 수 없습니다.'] } };
    }

    const db = getDatabase();

    const [existing] = await db
      .select({ projectId: testCaseTemplates.project_id })
      .from(testCaseTemplates)
      .where(eq(testCaseTemplates.id, templateId))
      .limit(1);

    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _template: ['접근 권한이 없습니다.'] } };
    }

    const [deleted] = await db
      .update(testCaseTemplates)
      .set({
        lifecycle_status: 'DELETED',
        updated_at: new Date(),
      })
      .where(eq(testCaseTemplates.id, templateId))
      .returning();

    if (!deleted) {
      return { success: false, errors: { _template: ['템플릿을 찾을 수 없습니다.'] } };
    }

    return {
      success: true,
      data: { id: deleted.id },
      message: '템플릿이 삭제되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteTemplate' } });
    return {
      success: false,
      errors: { _template: ['템플릿을 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const incrementTemplateUsage = async (
  templateId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    if (isBuiltinTemplate(templateId)) {
      return { success: true, data: { id: templateId } };
    }

    const db = getDatabase();

    await db
      .update(testCaseTemplates)
      .set({
        usage_count: sql`${testCaseTemplates.usage_count} + 1`,
        updated_at: new Date(),
      })
      .where(eq(testCaseTemplates.id, templateId));

    return { success: true, data: { id: templateId } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'incrementTemplateUsage' } });
    return {
      success: false,
      errors: { _template: ['사용 횟수 업데이트 중 오류가 발생했습니다.'] },
    };
  }
};
