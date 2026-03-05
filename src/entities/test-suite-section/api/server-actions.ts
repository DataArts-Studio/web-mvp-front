'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testSuites, testSuiteSections, testCases } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import type { TestSuiteSection, CreateSectionInput, UpdateSectionInput, ReorderSectionsInput } from '../model';
import { and, eq, asc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';

async function getSuiteProjectId(suiteId: string): Promise<string | null> {
  const db = getDatabase();
  const [row] = await db
    .select({ projectId: testSuites.project_id })
    .from(testSuites)
    .where(eq(testSuites.id, suiteId))
    .limit(1);
  return row?.projectId ?? null;
}

function toSection(row: typeof testSuiteSections.$inferSelect): TestSuiteSection {
  return {
    id: row.id,
    suiteId: row.suite_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getSections = async (suiteId: string): Promise<ActionResult<TestSuiteSection[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testSuiteSections)
      .where(eq(testSuiteSections.suite_id, suiteId))
      .orderBy(asc(testSuiteSections.sort_order));

    return { success: true, data: rows.map(toSection) };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getSections' } });
    return { success: false, errors: { _section: ['섹션을 불러오는 도중 오류가 발생했습니다.'] } };
  }
};

export const createSection = async (input: CreateSectionInput): Promise<ActionResult<TestSuiteSection>> => {
  try {
    const projectId = await getSuiteProjectId(input.suiteId);
    if (!projectId || !(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const trimmedName = input.name.trim();

    // 중복 이름 확인
    const [existing] = await db
      .select({ id: testSuiteSections.id })
      .from(testSuiteSections)
      .where(and(eq(testSuiteSections.suite_id, input.suiteId), eq(testSuiteSections.name, trimmedName)))
      .limit(1);

    if (existing) {
      return { success: false, errors: { name: ['이미 존재하는 섹션 이름입니다.'] } };
    }

    // 다음 sort_order 계산
    const rows = await db
      .select({ sortOrder: testSuiteSections.sort_order })
      .from(testSuiteSections)
      .where(eq(testSuiteSections.suite_id, input.suiteId));
    const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0;

    const id = uuidv7();
    const [inserted] = await db
      .insert(testSuiteSections)
      .values({
        id,
        suite_id: input.suiteId,
        name: trimmedName,
        sort_order: nextOrder,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    if (!inserted) {
      return { success: false, errors: { _section: ['섹션을 생성하는 도중 오류가 발생했습니다.'] } };
    }

    return { success: true, data: toSection(inserted), message: '섹션이 생성되었습니다.' };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createSection' } });
    return { success: false, errors: { _section: ['섹션을 생성하는 도중 오류가 발생했습니다.'] } };
  }
};

export const updateSection = async (input: UpdateSectionInput): Promise<ActionResult<TestSuiteSection>> => {
  try {
    const db = getDatabase();

    // 기존 섹션 조회 → 접근 권한 확인
    const [existing] = await db
      .select()
      .from(testSuiteSections)
      .where(eq(testSuiteSections.id, input.id))
      .limit(1);

    if (!existing) {
      return { success: false, errors: { _section: ['섹션을 찾을 수 없습니다.'] } };
    }

    const projectId = await getSuiteProjectId(existing.suite_id);
    if (!projectId || !(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();

      // 중복 이름 확인 (자기 자신 제외)
      const [dup] = await db
        .select({ id: testSuiteSections.id })
        .from(testSuiteSections)
        .where(
          and(
            eq(testSuiteSections.suite_id, existing.suite_id),
            eq(testSuiteSections.name, trimmedName),
          ),
        )
        .limit(1);

      if (dup && dup.id !== input.id) {
        return { success: false, errors: { name: ['이미 존재하는 섹션 이름입니다.'] } };
      }

      updateData.name = trimmedName;
    }

    if (input.sortOrder !== undefined) {
      updateData.sort_order = input.sortOrder;
    }

    const [updated] = await db
      .update(testSuiteSections)
      .set(updateData)
      .where(eq(testSuiteSections.id, input.id))
      .returning();

    if (!updated) {
      return { success: false, errors: { _section: ['섹션을 수정하는 도중 오류가 발생했습니다.'] } };
    }

    return { success: true, data: toSection(updated) };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateSection' } });
    return { success: false, errors: { _section: ['섹션을 수정하는 도중 오류가 발생했습니다.'] } };
  }
};

export const deleteSection = async (sectionId: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    const [existing] = await db
      .select()
      .from(testSuiteSections)
      .where(eq(testSuiteSections.id, sectionId))
      .limit(1);

    if (!existing) {
      return { success: false, errors: { _section: ['섹션을 찾을 수 없습니다.'] } };
    }

    const projectId = await getSuiteProjectId(existing.suite_id);
    if (!projectId || !(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };
    }

    // 하위 케이스의 section_id를 NULL로 설정 (ON DELETE SET NULL이지만 명시적으로)
    await db
      .update(testCases)
      .set({ section_id: null, updated_at: new Date() })
      .where(eq(testCases.section_id, sectionId));

    // 섹션 삭제
    await db.delete(testSuiteSections).where(eq(testSuiteSections.id, sectionId));

    return { success: true, data: { id: sectionId }, message: '섹션이 삭제되었습니다. 포함된 케이스는 미분류로 이동되었습니다.' };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteSection' } });
    return { success: false, errors: { _section: ['섹션을 삭제하는 도중 오류가 발생했습니다.'] } };
  }
};

export const reorderSections = async (input: ReorderSectionsInput): Promise<ActionResult<null>> => {
  try {
    const projectId = await getSuiteProjectId(input.suiteId);
    if (!projectId || !(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    await Promise.all(
      input.sectionIds.map((id, index) =>
        db
          .update(testSuiteSections)
          .set({ sort_order: index, updated_at: new Date() })
          .where(and(eq(testSuiteSections.id, id), eq(testSuiteSections.suite_id, input.suiteId))),
      ),
    );

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderSections' } });
    return { success: false, errors: { _section: ['섹션 순서를 변경하는 도중 오류가 발생했습니다.'] } };
  }
};

export const moveTestCaseToSection = async (
  caseId: string,
  sectionId: string | null,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();

    const [tc] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, caseId))
      .limit(1);

    if (!tc?.projectId || !(await requireProjectAccess(tc.projectId))) {
      return { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };
    }

    await db
      .update(testCases)
      .set({ section_id: sectionId, updated_at: new Date() })
      .where(eq(testCases.id, caseId));

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'moveTestCaseToSection' } });
    return { success: false, errors: { _section: ['케이스를 이동하는 도중 오류가 발생했습니다.'] } };
  }
};
