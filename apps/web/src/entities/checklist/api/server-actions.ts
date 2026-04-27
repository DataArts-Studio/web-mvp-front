'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, checklists, checklistItems } from '@/shared/lib/db';
import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';
import type { ActionResult } from '@/shared/types';
import type { ChecklistWithItems, ChecklistWithProgress } from '../model/types';
import { CreateChecklistSchema, AddChecklistItemSchema } from '../model/schema';

// --- 생성 ---
export const createChecklist = async (
  input: { projectId: string; title: string; items: { content: string }[] },
): Promise<ActionResult<{ id: string }>> => {
  try {
    const parsed = CreateChecklistSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _checklist: [parsed.error.errors[0].message] } };
    }

    const db = getDatabase();
    const { projectId, title, items } = parsed.data;

    const [checklist] = await db
      .insert(checklists)
      .values({ project_id: projectId, title })
      .returning({ id: checklists.id });

    if (items.length > 0) {
      await db.insert(checklistItems).values(
        items.map((item, idx) => ({
          checklist_id: checklist.id,
          content: item.content,
          sort_order: idx * 1000,
        })),
      );
    }

    return { success: true, data: { id: checklist.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createChecklist' } });
    return { success: false, errors: { _checklist: ['체크리스트 생성에 실패했습니다.'] } };
  }
};

// --- 목록 조회 ---
export const getChecklistsByProjectId = async (
  projectId: string,
): Promise<ActionResult<ChecklistWithProgress[]>> => {
  try {
    const db = getDatabase();

    const rows = await db
      .select({
        id: checklists.id,
        project_id: checklists.project_id,
        title: checklists.title,
        status: checklists.status,
        started_at: checklists.started_at,
        completed_at: checklists.completed_at,
        created_at: checklists.created_at,
        updated_at: checklists.updated_at,
        totalItems: count(checklistItems.id),
        checkedItems: count(sql`CASE WHEN ${checklistItems.is_checked} = true THEN 1 END`),
      })
      .from(checklists)
      .leftJoin(checklistItems, eq(checklistItems.checklist_id, checklists.id))
      .where(
        and(
          eq(checklists.project_id, projectId),
          eq(checklists.lifecycle_status, 'ACTIVE'),
        ),
      )
      .groupBy(checklists.id)
      .orderBy(checklists.updated_at);

    const data: ChecklistWithProgress[] = rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      title: r.title,
      status: r.status,
      startedAt: r.started_at?.toISOString() ?? null,
      completedAt: r.completed_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      totalItems: r.totalItems,
      checkedItems: r.checkedItems,
    }));

    return { success: true, data };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getChecklistsByProjectId' } });
    return { success: false, errors: { _checklist: ['체크리스트 목록을 불러오는 데 실패했습니다.'] } };
  }
};

// --- 상세 조회 ---
export const getChecklistById = async (
  checklistId: string,
): Promise<ActionResult<ChecklistWithItems>> => {
  try {
    const db = getDatabase();

    const [row] = await db
      .select()
      .from(checklists)
      .where(eq(checklists.id, checklistId))
      .limit(1);

    if (!row) {
      return { success: false, errors: { _checklist: ['체크리스트를 찾을 수 없습니다.'] } };
    }

    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.checklist_id, checklistId))
      .orderBy(asc(checklistItems.sort_order));

    return {
      success: true,
      data: {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        status: row.status,
        startedAt: row.started_at?.toISOString() ?? null,
        completedAt: row.completed_at?.toISOString() ?? null,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        items: items.map((i) => ({
          id: i.id,
          content: i.content,
          isChecked: i.is_checked,
          sortOrder: i.sort_order,
          checkedAt: i.checked_at?.toISOString() ?? null,
          createdAt: i.created_at.toISOString(),
        })),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getChecklistById' } });
    return { success: false, errors: { _checklist: ['체크리스트를 불러오는 데 실패했습니다.'] } };
  }
};

// --- 항목 체크/언체크 ---
export const toggleChecklistItem = async (
  itemId: string,
  isChecked: boolean,
): Promise<ActionResult<{ checklistStatus: string }>> => {
  try {
    const db = getDatabase();

    // 항목 업데이트
    const [updated] = await db
      .update(checklistItems)
      .set({
        is_checked: isChecked,
        checked_at: isChecked ? new Date() : null,
      })
      .where(eq(checklistItems.id, itemId))
      .returning({ checklist_id: checklistItems.checklist_id });

    if (!updated) {
      return { success: false, errors: { _checklist: ['항목을 찾을 수 없습니다.'] } };
    }

    // 체크리스트 상태 자동 전환
    const [stats] = await db
      .select({
        total: count(),
        checked: count(sql`CASE WHEN ${checklistItems.is_checked} = true THEN 1 END`),
      })
      .from(checklistItems)
      .where(eq(checklistItems.checklist_id, updated.checklist_id));

    let newStatus: string;
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    if (stats.checked === stats.total) {
      newStatus = 'completed';
      updateData.status = 'completed';
      updateData.completed_at = new Date();
    } else if (stats.checked > 0) {
      newStatus = 'in_progress';
      updateData.status = 'in_progress';
      updateData.completed_at = null;
    } else {
      newStatus = 'open';
      updateData.status = 'open';
      updateData.completed_at = null;
    }

    // 첫 체크 시 started_at 기록
    const [checklist] = await db
      .select({ started_at: checklists.started_at })
      .from(checklists)
      .where(eq(checklists.id, updated.checklist_id))
      .limit(1);

    if (!checklist.started_at && stats.checked > 0) {
      updateData.started_at = new Date();
    }

    await db
      .update(checklists)
      .set(updateData)
      .where(eq(checklists.id, updated.checklist_id));

    return { success: true, data: { checklistStatus: newStatus } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'toggleChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 상태 변경에 실패했습니다.'] } };
  }
};

// --- 항목 추가 ---
export const addChecklistItem = async (
  input: { checklistId: string; content: string },
): Promise<ActionResult<{ id: string }>> => {
  try {
    const parsed = AddChecklistItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _checklist: [parsed.error.errors[0].message] } };
    }

    const db = getDatabase();

    // 현재 최대 sort_order 조회
    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${checklistItems.sort_order}), 0)` })
      .from(checklistItems)
      .where(eq(checklistItems.checklist_id, parsed.data.checklistId));

    const [item] = await db
      .insert(checklistItems)
      .values({
        checklist_id: parsed.data.checklistId,
        content: parsed.data.content,
        sort_order: (maxOrder?.max ?? 0) + 1000,
      })
      .returning({ id: checklistItems.id });

    // 완료 상태였으면 in_progress로 변경
    await db
      .update(checklists)
      .set({ status: 'open', completed_at: null, updated_at: new Date() })
      .where(
        and(
          eq(checklists.id, parsed.data.checklistId),
          eq(checklists.status, 'completed'),
        ),
      );

    return { success: true, data: { id: item.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 추가에 실패했습니다.'] } };
  }
};

// --- 항목 삭제 ---
export const deleteChecklistItem = async (
  itemId: string,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();
    await db.delete(checklistItems).where(eq(checklistItems.id, itemId));
    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 삭제에 실패했습니다.'] } };
  }
};

// --- 체크리스트 삭제 (소프트) ---
export const archiveChecklist = async (
  checklistId: string,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();
    await db
      .update(checklists)
      .set({
        lifecycle_status: 'DELETED',
        archived_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(checklists.id, checklistId));

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveChecklist' } });
    return { success: false, errors: { _checklist: ['체크리스트 삭제에 실패했습니다.'] } };
  }
};

// --- 항목 순서 변경 ---
export const reorderChecklistItems = async (
  checklistId: string,
  orderedIds: string[],
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();

    await Promise.all(
      orderedIds.map((id, idx) =>
        db
          .update(checklistItems)
          .set({ sort_order: idx * 1000 })
          .where(
            and(
              eq(checklistItems.id, id),
              eq(checklistItems.checklist_id, checklistId),
            ),
          ),
      ),
    );

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderChecklistItems' } });
    return { success: false, errors: { _checklist: ['순서 변경에 실패했습니다.'] } };
  }
};

// --- TC 변환 ---
export const convertChecklistToTestCases = async (
  checklistId: string,
  itemIds: string[],
  projectId: string,
  suiteId?: string,
): Promise<ActionResult<{ count: number }>> => {
  try {
    const db = getDatabase();

    const items = await db
      .select()
      .from(checklistItems)
      .where(
        and(
          eq(checklistItems.checklist_id, checklistId),
          inArray(checklistItems.id, itemIds),
        ),
      )
      .orderBy(asc(checklistItems.sort_order));

    if (items.length === 0) {
      return { success: false, errors: { _checklist: ['변환할 항목이 없습니다.'] } };
    }

    // 동적 import로 createTestCase 가져오기
    const { testCases } = await import('@/shared/lib/db');

    // display_id 최대값 조회
    const [maxDisplayId] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
      .from(testCases)
      .where(eq(testCases.project_id, projectId));

    let nextDisplayId = (maxDisplayId?.max ?? 0) + 1;

    await db.insert(testCases).values(
      items.map((item) => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        name: item.content,
        test_suite_id: suiteId ?? null,
        display_id: nextDisplayId++,
        sort_order: 0,
      })),
    );

    return { success: true, data: { count: items.length } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'convertChecklistToTestCases' } });
    return { success: false, errors: { _checklist: ['TC 변환에 실패했습니다.'] } };
  }
};
