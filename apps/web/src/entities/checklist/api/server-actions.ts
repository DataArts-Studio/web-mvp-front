'use server';

import { ACCESS_DENIED, belongsToProject, canAccess } from '@/access/lib/project-scope';
import { lockCaseNumbers, toCaseKey } from '@/entities/test-case/api/case-number-lock';
import { recordCreatedCases } from '@/entities/test-case/api/record-created-cases';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { type ChecklistStatus, checklistItems, checklists, getDatabase } from '@testea/db';
import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';

import { AddChecklistItemSchema, CreateChecklistSchema } from '../model/schema';
import type { ChecklistWithItems, ChecklistWithProgress } from '../model/types';

type Database = ReturnType<typeof getDatabase>;

/**
 * 항목 체크 현황으로 체크리스트 상태를 다시 계산해 저장한다 (#389).
 *
 * - 항목이 없거나 체크된 항목이 없으면 open, 일부면 in_progress, 전부면 completed.
 * - completed_at 은 완료로 바뀔 때만 찍고 완료가 아니면 비운다. started_at 은 첫 체크 때 한 번만 찍는다.
 *
 * 세기와 쓰기를 한 문장으로 처리해, 초기화처럼 여러 항목을 동시에 바꿀 때
 * 먼저 센 낡은 값으로 상태를 덮어쓰지 않게 한다.
 */
const recomputeChecklistStatus = async (
  db: Database,
  checklistId: string
): Promise<ChecklistStatus> => {
  const stats = db.$with('stats').as(
    db
      .select({
        total: sql<number>`count(*)::int`.as('total'),
        checked: sql<number>`count(*) filter (where ${checklistItems.is_checked})::int`.as(
          'checked'
        ),
      })
      .from(checklistItems)
      .where(eq(checklistItems.checklist_id, checklistId))
  );
  const nextStatus = sql`case
    when ${stats.total} = 0 or ${stats.checked} = 0 then 'open'
    when ${stats.checked} = ${stats.total} then 'completed'
    else 'in_progress'
  end`;

  const [row] = await db
    .with(stats)
    .update(checklists)
    .set({
      status: sql`${nextStatus}`,
      completed_at: sql`case when ${nextStatus} = 'completed' then coalesce(${checklists.completed_at}, now()) end`,
      started_at: sql`case when ${stats.checked} > 0 then coalesce(${checklists.started_at}, now()) else ${checklists.started_at} end`,
      updated_at: new Date(),
    })
    .from(stats)
    .where(eq(checklists.id, checklistId))
    .returning({ status: checklists.status });

  return row?.status ?? 'open';
};

// --- 생성 ---
export const createChecklist = async (input: {
  projectId: string;
  title: string;
  items: { content: string }[];
}): Promise<ActionResult<{ id: string }>> => {
  try {
    if (!(await canAccess('project', input.projectId))) return ACCESS_DENIED;

    const parsed = CreateChecklistSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _checklist: [parsed.error.errors[0].message] } };
    }

    const db = getDatabase();
    const { projectId, title, items } = parsed.data;

    // 항목 저장이 실패하면 빈 체크리스트도 남기지 않는다 (#390).
    const checklist = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(checklists)
        .values({ project_id: projectId, title })
        .returning({ id: checklists.id });

      if (items.length > 0) {
        await tx.insert(checklistItems).values(
          items.map((item, idx) => ({
            checklist_id: row.id,
            content: item.content,
            sort_order: idx * 1000,
          }))
        );
      }
      return row;
    });

    return { success: true, data: { id: checklist.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createChecklist' } });
    return { success: false, errors: { _checklist: ['체크리스트 생성에 실패했습니다.'] } };
  }
};

// --- 목록 조회 ---
export const getChecklistsByProjectId = async (
  projectId: string
): Promise<ActionResult<ChecklistWithProgress[]>> => {
  try {
    if (!(await canAccess('project', projectId))) return ACCESS_DENIED;

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
      .where(and(eq(checklists.project_id, projectId), eq(checklists.lifecycle_status, 'ACTIVE')))
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
    return {
      success: false,
      errors: { _checklist: ['체크리스트 목록을 불러오는 데 실패했습니다.'] },
    };
  }
};

// --- 상세 조회 ---
export const getChecklistById = async (
  checklistId: string
): Promise<ActionResult<ChecklistWithItems>> => {
  try {
    if (!(await canAccess('checklist', checklistId))) return ACCESS_DENIED;

    const db = getDatabase();

    const [row] = await db.select().from(checklists).where(eq(checklists.id, checklistId)).limit(1);

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
  isChecked: boolean
): Promise<ActionResult<{ checklistStatus: string }>> => {
  try {
    if (!(await canAccess('checklistItem', itemId))) return ACCESS_DENIED;

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

    const checklistStatus = await recomputeChecklistStatus(db, updated.checklist_id);

    return { success: true, data: { checklistStatus } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'toggleChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 상태 변경에 실패했습니다.'] } };
  }
};

// --- 항목 추가 ---
export const addChecklistItem = async (input: {
  checklistId: string;
  content: string;
}): Promise<ActionResult<{ id: string }>> => {
  try {
    if (!(await canAccess('checklist', input.checklistId))) return ACCESS_DENIED;

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

    // 완료 상태였다면 미체크 항목이 생겼으니 진행 중으로 돌아간다 (#389).
    await recomputeChecklistStatus(db, parsed.data.checklistId);

    return { success: true, data: { id: item.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 추가에 실패했습니다.'] } };
  }
};

// --- 항목 삭제 ---
export const deleteChecklistItem = async (itemId: string): Promise<ActionResult<null>> => {
  try {
    if (!(await canAccess('checklistItem', itemId))) return ACCESS_DENIED;

    const db = getDatabase();
    const [deleted] = await db
      .delete(checklistItems)
      .where(eq(checklistItems.id, itemId))
      .returning({ checklist_id: checklistItems.checklist_id });

    // 남은 미체크 항목을 지우면 완료가 되어야 한다 (#389).
    if (deleted) await recomputeChecklistStatus(db, deleted.checklist_id);

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteChecklistItem' } });
    return { success: false, errors: { _checklist: ['항목 삭제에 실패했습니다.'] } };
  }
};

// --- 체크리스트 삭제 (소프트) ---
export const archiveChecklist = async (checklistId: string): Promise<ActionResult<null>> => {
  try {
    if (!(await canAccess('checklist', checklistId))) return ACCESS_DENIED;

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
  orderedIds: string[]
): Promise<ActionResult<null>> => {
  try {
    if (!(await canAccess('checklist', checklistId))) return ACCESS_DENIED;

    const db = getDatabase();

    await Promise.all(
      orderedIds.map((id, idx) =>
        db
          .update(checklistItems)
          .set({ sort_order: idx * 1000 })
          .where(and(eq(checklistItems.id, id), eq(checklistItems.checklist_id, checklistId)))
      )
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
  suiteId?: string
): Promise<ActionResult<{ count: number }>> => {
  try {
    if (!(await canAccess('project', projectId))) return ACCESS_DENIED;
    // 체크리스트와 대상 스위트가 모두 같은 프로젝트 소속이어야 한다.
    if (
      !(await belongsToProject('checklist', checklistId, projectId)) ||
      (suiteId && !(await belongsToProject('testSuite', suiteId, projectId)))
    ) {
      return ACCESS_DENIED;
    }

    const db = getDatabase();

    const items = await db
      .select()
      .from(checklistItems)
      .where(and(eq(checklistItems.checklist_id, checklistId), inArray(checklistItems.id, itemIds)))
      .orderBy(asc(checklistItems.sort_order));

    if (items.length === 0) {
      return { success: false, errors: { _checklist: ['변환할 항목이 없습니다.'] } };
    }

    // 동적 import로 createTestCase 가져오기
    const { testCases } = await import('@testea/db');

    const now = new Date();

    await db.transaction(async (tx) => {
      await lockCaseNumbers(tx, projectId);
      const [maxDisplayId] = await tx
        .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
        .from(testCases)
        .where(eq(testCases.project_id, projectId));

      let nextDisplayId = (maxDisplayId?.max ?? 0) + 1;

      const created = await tx
        .insert(testCases)
        .values(
          items.map((item) => {
            const displayId = nextDisplayId++;
            return {
              id: crypto.randomUUID(),
              project_id: projectId,
              name: item.content,
              test_suite_id: suiteId ?? null,
              display_id: displayId,
              case_key: toCaseKey(displayId),
              sort_order: 0,
              // DB 컬럼에 DEFAULT now() 가 없어 drizzle 의 DEFAULT 키워드만으로는
              // NOT NULL 제약에서 막힌다. 값을 명시한다.
              created_at: now,
              updated_at: now,
            };
          })
        )
        .returning();

      // 직접 만든 케이스처럼 v1 버전을 남기고 스위트에 연결된 실행에도 넣는다 (#391).
      await recordCreatedCases(tx, created, '체크리스트 변환으로 생성');
    });

    invalidateCache(INVALIDATE.cases);
    return { success: true, data: { count: items.length } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'convertChecklistToTestCases' } });
    return { success: false, errors: { _checklist: ['TC 변환에 실패했습니다.'] } };
  }
};
