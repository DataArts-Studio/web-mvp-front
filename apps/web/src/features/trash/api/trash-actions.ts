'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { restoreArchivedCasesToRuns } from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  auditLogs,
  getDatabase,
  milestones,
  testCases,
  testScenarios,
  testSuites,
} from '@testea/db';
import { and, eq, inArray, lt, ne } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

import type { TrashItem, TrashItemType } from '../model/types';

const AUTO_DELETE_DAYS = 30;

type AuditAction = 'permanent_delete' | 'auto_cleanup' | 'empty_trash';

type Database = ReturnType<typeof getDatabase>;
type Db = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * 영구 삭제된 스위트를 가리키는 활성 케이스를 미분류로 돌린다.
 * 케이스만 따로 복원한 뒤 스위트를 영구 삭제하면, 케이스가 사라진 스위트를 가리켜 어떤 목록에도 나오지 않는다 (#409).
 */
async function detachCasesFromPurgedSuites(db: Db, projectId: string) {
  const purgedSuites = db
    .select({ id: testSuites.id })
    .from(testSuites)
    .where(and(eq(testSuites.project_id, projectId), eq(testSuites.lifecycle_status, 'PURGED')));
  await db
    .update(testCases)
    .set({ test_suite_id: null, section_id: null })
    .where(
      and(
        eq(testCases.project_id, projectId),
        eq(testCases.lifecycle_status, 'ACTIVE'),
        inArray(testCases.test_suite_id, purgedSuites)
      )
    );
}

/**
 * 영구 삭제 전 audit_logs에 스냅샷을 기록합니다.
 */
async function writeAuditLogs(
  db: Db,
  entries: {
    projectId: string | null;
    entityType: string;
    entityId: string;
    entityName: string | null;
    action: AuditAction;
    snapshot: unknown;
    deletedAt: Date | null;
  }[]
) {
  if (entries.length === 0) return;

  await db.insert(auditLogs).values(
    entries.map((e) => ({
      id: uuidv7(),
      project_id: e.projectId,
      entity_type: e.entityType,
      entity_id: e.entityId,
      entity_name: e.entityName,
      action: e.action,
      snapshot: e.snapshot,
      deleted_at: e.deletedAt ?? new Date(),
      created_at: new Date(),
    }))
  );
}

/**
 * 프로젝트의 휴지통 항목을 모두 조회합니다.
 * on-access 방식으로 30일 경과 항목을 자동 정리합니다.
 */
export const getTrashedItems = async (projectId: string): Promise<ActionResult<TrashItem[]>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _trash: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    // on-access auto cleanup: 30일 경과 항목 조회 후 audit log 기록 → 영구 삭제
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUTO_DELETE_DAYS);

    const [expiredCases, expiredSuites, expiredMilestones, expiredScenarios] = await Promise.all([
      db
        .select()
        .from(testCases)
        .where(
          and(
            eq(testCases.project_id, projectId),
            eq(testCases.lifecycle_status, 'DELETED'),
            lt(testCases.archived_at, cutoff)
          )
        ),
      db
        .select()
        .from(testSuites)
        .where(
          and(
            eq(testSuites.project_id, projectId),
            eq(testSuites.lifecycle_status, 'DELETED'),
            lt(testSuites.archived_at, cutoff)
          )
        ),
      db
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.project_id, projectId),
            eq(milestones.lifecycle_status, 'DELETED'),
            lt(milestones.archived_at, cutoff)
          )
        ),
      db
        .select()
        .from(testScenarios)
        .where(
          and(
            eq(testScenarios.project_id, projectId),
            eq(testScenarios.lifecycle_status, 'DELETED'),
            lt(testScenarios.archived_at, cutoff)
          )
        ),
    ]);

    // audit log 기록
    const auditEntries = [
      ...expiredCases.map((row) => ({
        projectId,
        entityType: 'test_case',
        entityId: row.id,
        entityName: row.name,
        action: 'auto_cleanup' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...expiredSuites.map((row) => ({
        projectId,
        entityType: 'test_suite',
        entityId: row.id,
        entityName: row.name,
        action: 'auto_cleanup' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...expiredMilestones.map((row) => ({
        projectId,
        entityType: 'milestone',
        entityId: row.id,
        entityName: row.name,
        action: 'auto_cleanup' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...expiredScenarios.map((row) => ({
        projectId,
        entityType: 'test_scenario',
        entityId: row.id,
        entityName: row.name,
        action: 'auto_cleanup' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
    ];

    if (auditEntries.length > 0) {
      // 기록, 영구 삭제 표시, 케이스 분리를 함께 반영한다 (#390).
      await db.transaction(async (tx) => {
        await writeAuditLogs(tx, auditEntries);

        // PURGED 마킹 (소프트 딜리트)
        const purgedAt = new Date();
        await Promise.all([
          expiredCases.length > 0 &&
            tx
              .update(testCases)
              .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
              .where(
                and(
                  eq(testCases.project_id, projectId),
                  eq(testCases.lifecycle_status, 'DELETED'),
                  lt(testCases.archived_at, cutoff)
                )
              ),
          expiredSuites.length > 0 &&
            tx
              .update(testSuites)
              .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
              .where(
                and(
                  eq(testSuites.project_id, projectId),
                  eq(testSuites.lifecycle_status, 'DELETED'),
                  lt(testSuites.archived_at, cutoff)
                )
              ),
          expiredMilestones.length > 0 &&
            tx
              .update(milestones)
              .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
              .where(
                and(
                  eq(milestones.project_id, projectId),
                  eq(milestones.lifecycle_status, 'DELETED'),
                  lt(milestones.archived_at, cutoff)
                )
              ),
          expiredScenarios.length > 0 &&
            tx
              .update(testScenarios)
              .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
              .where(
                and(
                  eq(testScenarios.project_id, projectId),
                  eq(testScenarios.lifecycle_status, 'DELETED'),
                  lt(testScenarios.archived_at, cutoff)
                )
              ),
        ]);
        if (expiredSuites.length > 0) await detachCasesFromPurgedSuites(tx, projectId);
      });
    }

    // 남은 휴지통 항목 조회
    const [trashedCases, trashedSuites, trashedMilestones, trashedScenarios] = await Promise.all([
      db
        .select({
          id: testCases.id,
          title: testCases.name,
          deletedAt: testCases.archived_at,
        })
        .from(testCases)
        .where(and(eq(testCases.project_id, projectId), eq(testCases.lifecycle_status, 'DELETED'))),
      db
        .select({
          id: testSuites.id,
          title: testSuites.name,
          deletedAt: testSuites.archived_at,
        })
        .from(testSuites)
        .where(
          and(eq(testSuites.project_id, projectId), eq(testSuites.lifecycle_status, 'DELETED'))
        ),
      db
        .select({
          id: milestones.id,
          title: milestones.name,
          deletedAt: milestones.archived_at,
        })
        .from(milestones)
        .where(
          and(eq(milestones.project_id, projectId), eq(milestones.lifecycle_status, 'DELETED'))
        ),
      db
        .select({
          id: testScenarios.id,
          title: testScenarios.name,
          deletedAt: testScenarios.archived_at,
        })
        .from(testScenarios)
        .where(
          and(
            eq(testScenarios.project_id, projectId),
            eq(testScenarios.lifecycle_status, 'DELETED')
          )
        ),
    ]);

    const now = new Date();
    const toDaysRemaining = (deletedAt: Date | null): number => {
      if (!deletedAt) return AUTO_DELETE_DAYS;
      const elapsed = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, AUTO_DELETE_DAYS - elapsed);
    };

    const items: TrashItem[] = [
      ...trashedCases.map((row) => ({
        id: row.id,
        type: 'case' as TrashItemType,
        title: row.title,
        deletedAt: row.deletedAt ?? now,
        daysRemaining: toDaysRemaining(row.deletedAt),
      })),
      ...trashedSuites.map((row) => ({
        id: row.id,
        type: 'suite' as TrashItemType,
        title: row.title,
        deletedAt: row.deletedAt ?? now,
        daysRemaining: toDaysRemaining(row.deletedAt),
      })),
      ...trashedMilestones.map((row) => ({
        id: row.id,
        type: 'milestone' as TrashItemType,
        title: row.title,
        deletedAt: row.deletedAt ?? now,
        daysRemaining: toDaysRemaining(row.deletedAt),
      })),
      ...trashedScenarios.map((row) => ({
        id: row.id,
        type: 'scenario' as TrashItemType,
        title: row.title,
        deletedAt: row.deletedAt ?? now,
        daysRemaining: toDaysRemaining(row.deletedAt),
      })),
    ];

    // 삭제일 기준 최신순 정렬
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return { success: true, data: items };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTrashedItems' } });
    return {
      success: false,
      errors: { _trash: ['휴지통 데이터를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 휴지통 항목을 복원합니다.
 */
export const restoreItem = async (
  projectId: string,
  targetType: TrashItemType,
  targetId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _trash: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const now = new Date();

    switch (targetType) {
      case 'case': {
        const restored = await db.transaction(async (tx) => {
          const [target] = await tx
            .select({
              id: testCases.id,
              archivedAt: testCases.archived_at,
              suiteId: testCases.test_suite_id,
            })
            .from(testCases)
            .where(
              and(
                eq(testCases.id, targetId),
                eq(testCases.project_id, projectId),
                eq(testCases.lifecycle_status, 'DELETED')
              )
            )
            .limit(1);
          if (!target) return null;

          // 소속 스위트가 휴지통에 있거나 영구 삭제됐으면 미분류로 복원한다.
          // 그대로 두면 케이스가 비활성 스위트를 가리켜 미분류에도 어떤 스위트에도 나오지 않는다 (#409).
          let detached = false;
          if (target.suiteId) {
            const [inactiveSuite] = await tx
              .select({ id: testSuites.id })
              .from(testSuites)
              .where(
                and(eq(testSuites.id, target.suiteId), ne(testSuites.lifecycle_status, 'ACTIVE'))
              )
              .limit(1);
            detached = !!inactiveSuite;
          }

          const [row] = await tx
            .update(testCases)
            .set({
              lifecycle_status: 'ACTIVE',
              archived_at: null,
              updated_at: now,
              ...(detached ? { test_suite_id: null, section_id: null } : {}),
            })
            .where(eq(testCases.id, target.id))
            .returning();
          // 삭제할 때 진행 중인 실행에서 뺐던 결과를 되돌린다 (#377).
          if (target.archivedAt) {
            await restoreArchivedCasesToRuns(tx, [target.id], target.archivedAt);
          }
          return row ? { row, detached } : null;
        });
        if (!restored) {
          return { success: false, errors: { _trash: ['복원할 항목을 찾을 수 없습니다.'] } };
        }
        invalidateCache(INVALIDATE.all);
        return {
          success: true,
          data: { id: restored.row.id },
          message: restored.detached
            ? '스위트가 삭제된 상태라 테스트 케이스를 미분류로 복원했습니다.'
            : '테스트 케이스가 복원되었습니다.',
        };
      }
      case 'suite': {
        // 시나리오 파생 스위트는 한 시나리오당 ACTIVE 1건만 허용(유니크 인덱스).
        // 삭제 후 같은 시나리오로 새 스위트를 만든 상태에서 옛 스위트를 복원하면 제약 위반이
        // 나므로, 충돌이 있으면 23505 크래시 대신 명확한 안내로 막는다.
        const [target] = await db
          .select({ scenarioId: testSuites.test_scenario_id, archivedAt: testSuites.archived_at })
          .from(testSuites)
          .where(
            and(
              eq(testSuites.id, targetId),
              eq(testSuites.project_id, projectId),
              eq(testSuites.lifecycle_status, 'DELETED')
            )
          )
          .limit(1);
        if (!target) {
          return { success: false, errors: { _trash: ['복원할 항목을 찾을 수 없습니다.'] } };
        }
        if (target.scenarioId) {
          const [conflict] = await db
            .select({ id: testSuites.id })
            .from(testSuites)
            .where(
              and(
                eq(testSuites.test_scenario_id, target.scenarioId),
                eq(testSuites.lifecycle_status, 'ACTIVE')
              )
            )
            .limit(1);
          if (conflict) {
            return {
              success: false,
              errors: {
                _trash: [
                  '같은 시나리오에서 생성된 활성 스위트가 이미 있어 복원할 수 없습니다. 기존 스위트를 삭제한 뒤 다시 시도해주세요.',
                ],
              },
            };
          }
        }

        const restored = await db.transaction(async (tx) => {
          const [suite] = await tx
            .update(testSuites)
            .set({ lifecycle_status: 'ACTIVE', archived_at: null, updated_at: now })
            .where(
              and(
                eq(testSuites.id, targetId),
                eq(testSuites.project_id, projectId),
                eq(testSuites.lifecycle_status, 'DELETED')
              )
            )
            .returning();
          if (!suite || !target.archivedAt) return suite ?? null;

          // cascade: 스위트와 함께 삭제된 TC 만 복원한다. 그 전에 따로 삭제한 케이스는
          // archived_at 이 달라 휴지통에 남는다 (#378).
          const cases = await tx
            .update(testCases)
            .set({ lifecycle_status: 'ACTIVE', archived_at: null, updated_at: now })
            .where(
              and(
                eq(testCases.test_suite_id, targetId),
                eq(testCases.lifecycle_status, 'DELETED'),
                eq(testCases.archived_at, target.archivedAt)
              )
            )
            .returning({ id: testCases.id });
          await restoreArchivedCasesToRuns(
            tx,
            cases.map((row) => row.id),
            target.archivedAt
          );
          return suite;
        });
        if (!restored) {
          return { success: false, errors: { _trash: ['복원할 항목을 찾을 수 없습니다.'] } };
        }
        invalidateCache(INVALIDATE.all);
        return {
          success: true,
          data: { id: restored.id },
          message: '테스트 스위트가 복원되었습니다.',
        };
      }
      case 'milestone': {
        const [restored] = await db
          .update(milestones)
          .set({ lifecycle_status: 'ACTIVE', archived_at: null, updated_at: now })
          .where(
            and(
              eq(milestones.id, targetId),
              eq(milestones.project_id, projectId),
              eq(milestones.lifecycle_status, 'DELETED')
            )
          )
          .returning();
        if (!restored) {
          return { success: false, errors: { _trash: ['복원할 항목을 찾을 수 없습니다.'] } };
        }
        invalidateCache(INVALIDATE.all);
        return { success: true, data: { id: restored.id }, message: '마일스톤이 복원되었습니다.' };
      }
      case 'scenario': {
        // 시나리오 삭제는 파생 스위트를 건드리지 않으므로(스위트는 독립적으로 휴지통 관리),
        // 복원도 시나리오만 ACTIVE 로 되돌리면 된다. 파생 스위트 유니크 제약과도 충돌하지 않는다.
        const [restored] = await db
          .update(testScenarios)
          .set({ lifecycle_status: 'ACTIVE', archived_at: null, updated_at: now })
          .where(
            and(
              eq(testScenarios.id, targetId),
              eq(testScenarios.project_id, projectId),
              eq(testScenarios.lifecycle_status, 'DELETED')
            )
          )
          .returning();
        if (!restored) {
          return { success: false, errors: { _trash: ['복원할 항목을 찾을 수 없습니다.'] } };
        }
        invalidateCache(INVALIDATE.all);
        return { success: true, data: { id: restored.id }, message: '시나리오가 복원되었습니다.' };
      }
      default:
        return { success: false, errors: { _trash: ['지원하지 않는 항목 유형입니다.'] } };
    }
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'restoreItem' } });
    return {
      success: false,
      errors: { _trash: ['항목을 복원하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 휴지통 항목을 영구 삭제합니다.
 * 삭제 전 audit_logs에 전체 스냅샷을 기록합니다.
 */
export const permanentDeleteItem = async (
  projectId: string,
  targetType: TrashItemType,
  targetId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _trash: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    switch (targetType) {
      case 'case': {
        const [row] = await db
          .select()
          .from(testCases)
          .where(
            and(
              eq(testCases.id, targetId),
              eq(testCases.project_id, projectId),
              eq(testCases.lifecycle_status, 'DELETED')
            )
          );
        if (row) {
          await writeAuditLogs(db, [
            {
              projectId,
              entityType: 'test_case',
              entityId: row.id,
              entityName: row.name,
              action: 'permanent_delete',
              snapshot: row,
              deletedAt: row.archived_at,
            },
          ]);
          await db
            .update(testCases)
            .set({ lifecycle_status: 'PURGED', updated_at: new Date() })
            .where(and(eq(testCases.id, targetId), eq(testCases.project_id, projectId)));
        }
        break;
      }
      case 'suite': {
        // 스위트가 이 프로젝트 소속인지 먼저 확인한다. 아니면(부재/타 프로젝트) 하위 TC 까지 손대지 않는다.
        const [suiteRow] = await db
          .select()
          .from(testSuites)
          .where(
            and(
              eq(testSuites.id, targetId),
              eq(testSuites.project_id, projectId),
              eq(testSuites.lifecycle_status, 'DELETED')
            )
          );
        if (!suiteRow) break;

        const childCases = await db
          .select()
          .from(testCases)
          .where(
            and(eq(testCases.test_suite_id, targetId), eq(testCases.lifecycle_status, 'DELETED'))
          );

        const entries = [
          {
            projectId,
            entityType: 'test_suite',
            entityId: suiteRow.id,
            entityName: suiteRow.name,
            action: 'permanent_delete' as AuditAction,
            snapshot: suiteRow,
            deletedAt: suiteRow.archived_at,
          },
        ];
        for (const c of childCases) {
          entries.push({
            projectId,
            entityType: 'test_case',
            entityId: c.id,
            entityName: c.name,
            action: 'permanent_delete' as AuditAction,
            snapshot: c,
            deletedAt: c.archived_at,
          });
        }

        // 기록, 하위 케이스와 스위트의 영구 삭제 표시, 케이스 분리를 함께 반영한다 (#390).
        await db.transaction(async (tx) => {
          await writeAuditLogs(tx, entries);

          // 하위 TC + 스위트 PURGED 마킹 (스위트는 위에서 프로젝트 소속 확인됨)
          const purgedAt = new Date();
          await tx
            .update(testCases)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(eq(testCases.test_suite_id, targetId), eq(testCases.lifecycle_status, 'DELETED'))
            );
          await tx
            .update(testSuites)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(
                eq(testSuites.id, targetId),
                eq(testSuites.project_id, projectId),
                eq(testSuites.lifecycle_status, 'DELETED')
              )
            );
          await detachCasesFromPurgedSuites(tx, projectId);
        });
        break;
      }
      case 'milestone': {
        const [row] = await db
          .select()
          .from(milestones)
          .where(
            and(
              eq(milestones.id, targetId),
              eq(milestones.project_id, projectId),
              eq(milestones.lifecycle_status, 'DELETED')
            )
          );
        if (row) {
          await writeAuditLogs(db, [
            {
              projectId,
              entityType: 'milestone',
              entityId: row.id,
              entityName: row.name,
              action: 'permanent_delete',
              snapshot: row,
              deletedAt: row.archived_at,
            },
          ]);
          await db
            .update(milestones)
            .set({ lifecycle_status: 'PURGED', updated_at: new Date() })
            .where(and(eq(milestones.id, targetId), eq(milestones.project_id, projectId)));
        }
        break;
      }
      case 'scenario': {
        const [row] = await db
          .select()
          .from(testScenarios)
          .where(
            and(
              eq(testScenarios.id, targetId),
              eq(testScenarios.project_id, projectId),
              eq(testScenarios.lifecycle_status, 'DELETED')
            )
          );
        if (row) {
          await writeAuditLogs(db, [
            {
              projectId,
              entityType: 'test_scenario',
              entityId: row.id,
              entityName: row.name,
              action: 'permanent_delete',
              snapshot: row,
              deletedAt: row.archived_at,
            },
          ]);
          await db
            .update(testScenarios)
            .set({ lifecycle_status: 'PURGED', updated_at: new Date() })
            .where(and(eq(testScenarios.id, targetId), eq(testScenarios.project_id, projectId)));
        }
        break;
      }
      default:
        return { success: false, errors: { _trash: ['지원하지 않는 항목 유형입니다.'] } };
    }

    invalidateCache(INVALIDATE.all);
    return {
      success: true,
      data: { id: targetId },
      message: '항목이 영구 삭제되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'permanentDeleteItem' } });
    return {
      success: false,
      errors: { _trash: ['항목을 영구 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 휴지통을 비웁니다. (모든 DELETED 항목 스냅샷 기록 후 영구 삭제)
 */
export const emptyTrash = async (projectId: string): Promise<ActionResult<{ count: number }>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _trash: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    // 삭제 대상 전체 조회
    const [allCases, allSuites, allMilestones, allScenarios] = await Promise.all([
      db
        .select()
        .from(testCases)
        .where(and(eq(testCases.project_id, projectId), eq(testCases.lifecycle_status, 'DELETED'))),
      db
        .select()
        .from(testSuites)
        .where(
          and(eq(testSuites.project_id, projectId), eq(testSuites.lifecycle_status, 'DELETED'))
        ),
      db
        .select()
        .from(milestones)
        .where(
          and(eq(milestones.project_id, projectId), eq(milestones.lifecycle_status, 'DELETED'))
        ),
      db
        .select()
        .from(testScenarios)
        .where(
          and(
            eq(testScenarios.project_id, projectId),
            eq(testScenarios.lifecycle_status, 'DELETED')
          )
        ),
    ]);

    // audit log 기록
    const entries = [
      ...allCases.map((row) => ({
        projectId,
        entityType: 'test_case',
        entityId: row.id,
        entityName: row.name,
        action: 'empty_trash' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...allSuites.map((row) => ({
        projectId,
        entityType: 'test_suite',
        entityId: row.id,
        entityName: row.name,
        action: 'empty_trash' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...allMilestones.map((row) => ({
        projectId,
        entityType: 'milestone',
        entityId: row.id,
        entityName: row.name,
        action: 'empty_trash' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
      ...allScenarios.map((row) => ({
        projectId,
        entityType: 'test_scenario',
        entityId: row.id,
        entityName: row.name,
        action: 'empty_trash' as AuditAction,
        snapshot: row,
        deletedAt: row.archived_at,
      })),
    ];

    // 기록, 영구 삭제 표시, 케이스 분리를 함께 반영한다 (#390).
    await db.transaction(async (tx) => {
      if (entries.length > 0) {
        await writeAuditLogs(tx, entries);
      }

      // PURGED 마킹 (소프트 딜리트)
      const purgedAt = new Date();
      await Promise.all([
        allCases.length > 0 &&
          tx
            .update(testCases)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(eq(testCases.project_id, projectId), eq(testCases.lifecycle_status, 'DELETED'))
            ),
        allSuites.length > 0 &&
          tx
            .update(testSuites)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(eq(testSuites.project_id, projectId), eq(testSuites.lifecycle_status, 'DELETED'))
            ),
        allMilestones.length > 0 &&
          tx
            .update(milestones)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(eq(milestones.project_id, projectId), eq(milestones.lifecycle_status, 'DELETED'))
            ),
        allScenarios.length > 0 &&
          tx
            .update(testScenarios)
            .set({ lifecycle_status: 'PURGED', updated_at: purgedAt })
            .where(
              and(
                eq(testScenarios.project_id, projectId),
                eq(testScenarios.lifecycle_status, 'DELETED')
              )
            ),
      ]);
      if (allSuites.length > 0) await detachCasesFromPurgedSuites(tx, projectId);
    });

    const totalCount =
      allCases.length + allSuites.length + allMilestones.length + allScenarios.length;

    invalidateCache(INVALIDATE.all);
    return {
      success: true,
      data: { count: totalCount },
      message: '휴지통이 비워졌습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'emptyTrash' } });
    return {
      success: false,
      errors: { _trash: ['휴지통을 비우는 도중 오류가 발생했습니다.'] },
    };
  }
};
