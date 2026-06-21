'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { aiRequirementAnalyses, getDatabase, testScenarios, testSuites } from '@testea/db';
import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import {
  type CreateScenarioInput,
  CreateScenarioSchema,
  type ReorderScenariosInput,
  ReorderScenariosSchema,
  type SaveGeneratedScenariosInput,
  SaveGeneratedScenariosSchema,
  type ScenarioStatus,
  type UpdateScenarioInput,
  UpdateScenarioSchema,
} from '../model/schema';
import type { ScenarioFeatureListItem, ScenarioListFilter, ScenarioListItem } from '../model/types';

const accessDenied = (): ActionResult<never> => ({
  success: false,
  errors: { _scenario: ['프로젝트 접근 권한이 없습니다.'] },
});

const invalidInput = (message?: string): ActionResult<never> => ({
  success: false,
  errors: { _scenario: [message ?? '입력 값이 올바르지 않습니다.'] },
});

/**
 * 전달된 분석서(기능) id 가 해당 프로젝트 소유인지 확인한다.
 * 다른 프로젝트의 분석서 UUID 로 시나리오를 연결하지 못하도록 저장 전 검증용.
 */
const analysisBelongsToProject = async (
  db: ReturnType<typeof getDatabase>,
  projectId: string,
  requirementAnalysisId: string
): Promise<boolean> => {
  const [row] = await db
    .select({ id: aiRequirementAnalyses.id })
    .from(aiRequirementAnalyses)
    .where(
      and(
        eq(aiRequirementAnalyses.id, requirementAnalysisId),
        eq(aiRequirementAnalyses.project_id, projectId)
      )
    )
    .limit(1);
  return !!row;
};

/**
 * 프로젝트의 ACTIVE 시나리오 목록. sort_order 오름차순(동률 시 최신순).
 * 분석서 제목과 파생 스위트 수를 함께 집계한다. 선택적으로 분석서/타입/상태로 필터링.
 */
export const getScenarios = async (
  projectId: string,
  filter?: ScenarioListFilter
): Promise<ActionResult<ScenarioListItem[]>> => {
  try {
    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const db = getDatabase();

    const conditions = [
      eq(testScenarios.project_id, projectId),
      eq(testScenarios.lifecycle_status, 'ACTIVE'),
    ];
    if (filter?.requirementAnalysisId) {
      conditions.push(eq(testScenarios.requirement_analysis_id, filter.requirementAnalysisId));
    }
    if (filter?.manual) {
      conditions.push(isNull(testScenarios.requirement_analysis_id));
    }
    if (filter?.type) conditions.push(eq(testScenarios.type, filter.type));
    if (filter?.status) conditions.push(eq(testScenarios.status, filter.status));

    const rows = await db
      .select()
      .from(testScenarios)
      .where(and(...conditions))
      .orderBy(asc(testScenarios.sort_order), desc(testScenarios.created_at));

    if (rows.length === 0) return { success: true, data: [] };

    const scenarioIds = rows.map((r) => r.id);

    // 파생 스위트 수(시나리오별 집계).
    const suiteCountRows = await db
      .select({ scenarioId: testSuites.test_scenario_id, cnt: count() })
      .from(testSuites)
      .where(
        and(
          inArray(testSuites.test_scenario_id, scenarioIds),
          eq(testSuites.lifecycle_status, 'ACTIVE')
        )
      )
      .groupBy(testSuites.test_scenario_id);
    const suiteCountMap = new Map(suiteCountRows.map((r) => [r.scenarioId, Number(r.cnt)]));

    // 출처 분석서 제목.
    const analysisIds = [
      ...new Set(rows.map((r) => r.requirement_analysis_id).filter((id): id is string => !!id)),
    ];
    const titleMap = new Map<string, string>();
    if (analysisIds.length > 0) {
      const analysisRows = await db
        .select({ id: aiRequirementAnalyses.id, title: aiRequirementAnalyses.title })
        .from(aiRequirementAnalyses)
        .where(inArray(aiRequirementAnalyses.id, analysisIds));
      analysisRows.forEach((a) => titleMap.set(a.id, a.title));
    }

    const data: ScenarioListItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      type: row.type,
      status: row.status,
      relatedRequirementIds: row.related_requirement_ids ?? [],
      requirementAnalysisId: row.requirement_analysis_id,
      analysisTitle: row.requirement_analysis_id
        ? (titleMap.get(row.requirement_analysis_id) ?? null)
        : null,
      derivedSuiteCount: suiteCountMap.get(row.id) ?? 0,
      sortOrder: row.sort_order,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    return { success: true, data };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getScenarios' } });
    return { success: false, errors: { _scenario: ['시나리오 목록을 불러오지 못했습니다.'] } };
  }
};

const MANUAL_KEY = '__manual__';
const emptyStatusCounts = (): Record<ScenarioStatus, number> => ({
  DRAFT: 0,
  REVIEW: 0,
  CONFIRMED: 0,
});

/**
 * 시나리오 관리 마스터: 기능(요구사항 분석) 목록 + 각 기능의 영속 시나리오 수·상태 롤업.
 * 시나리오 0개 기능도 포함하고, 출처 없는(수동) 시나리오가 있으면 수동 버킷을 덧붙인다.
 */
export const getScenarioFeatures = async (
  projectId: string
): Promise<ActionResult<ScenarioFeatureListItem[]>> => {
  try {
    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const db = getDatabase();

    const analyses = await db
      .select({
        id: aiRequirementAnalyses.id,
        title: aiRequirementAnalyses.title,
        analysis: aiRequirementAnalyses.analysis,
        createdAt: aiRequirementAnalyses.created_at,
      })
      .from(aiRequirementAnalyses)
      .where(
        and(
          eq(aiRequirementAnalyses.project_id, projectId),
          eq(aiRequirementAnalyses.lifecycle_status, 'ACTIVE')
        )
      )
      .orderBy(desc(aiRequirementAnalyses.created_at));

    // 기능별 시나리오 수·상태 롤업(ACTIVE). requirement_analysis_id 가 NULL 이면 수동 버킷.
    const grouped = await db
      .select({
        raid: testScenarios.requirement_analysis_id,
        status: testScenarios.status,
        cnt: count(),
      })
      .from(testScenarios)
      .where(
        and(eq(testScenarios.project_id, projectId), eq(testScenarios.lifecycle_status, 'ACTIVE'))
      )
      .groupBy(testScenarios.requirement_analysis_id, testScenarios.status);

    const rollup = new Map<string, { total: number; counts: Record<ScenarioStatus, number> }>();
    for (const g of grouped) {
      const key = g.raid ?? MANUAL_KEY;
      let entry = rollup.get(key);
      if (!entry) {
        entry = { total: 0, counts: emptyStatusCounts() };
        rollup.set(key, entry);
      }
      const n = Number(g.cnt);
      entry.total += n;
      entry.counts[g.status] += n;
    }

    const features: ScenarioFeatureListItem[] = analyses.map((a) => {
      const entry = rollup.get(a.id);
      return {
        id: a.id,
        title: a.title,
        summary: a.analysis?.summary ?? '',
        isManual: false,
        scenarioCount: entry?.total ?? 0,
        statusCounts: entry?.counts ?? emptyStatusCounts(),
        createdAt: a.createdAt.toISOString(),
      };
    });

    const manual = rollup.get(MANUAL_KEY);
    if (manual && manual.total > 0) {
      features.push({
        id: null,
        title: '수동 작성',
        summary: '',
        isManual: true,
        scenarioCount: manual.total,
        statusCounts: manual.counts,
        createdAt: null,
      });
    }

    return { success: true, data: features };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getScenarioFeatures' } });
    return { success: false, errors: { _scenario: ['기능 목록을 불러오지 못했습니다.'] } };
  }
};

/** 시나리오 수동 추가. sort_order 는 프로젝트 내 MAX+1. */
export const createScenario = async (
  input: CreateScenarioInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const parsed = CreateScenarioSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error.issues[0]?.message);

    const {
      projectId,
      requirementAnalysisId,
      name,
      description,
      type,
      relatedRequirementIds,
      status,
    } = parsed.data;

    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const storageError = await checkStorageLimit(projectId);
    if (storageError) return storageError;

    const db = getDatabase();

    if (
      requirementAnalysisId &&
      !(await analysisBelongsToProject(db, projectId, requirementAnalysisId))
    ) {
      return invalidInput('대상 기능을 찾을 수 없습니다.');
    }

    const [maxSort] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testScenarios.sort_order}), 0)` })
      .from(testScenarios)
      .where(eq(testScenarios.project_id, projectId));

    const [row] = await db
      .insert(testScenarios)
      .values({
        project_id: projectId,
        requirement_analysis_id: requirementAnalysisId ?? null,
        name,
        description: description || null,
        type,
        related_requirement_ids: relatedRequirementIds,
        status,
        sort_order: (maxSort?.max ?? 0) + 1,
      })
      .returning({ id: testScenarios.id });

    return { success: true, data: { id: row.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createScenario' } });
    return { success: false, errors: { _scenario: ['시나리오 생성에 실패했습니다.'] } };
  }
};

/** AI 생성 시나리오 벌크 저장. 모두 DRAFT 로, sort_order 는 MAX+1 부터 순차. */
export const saveGeneratedScenarios = async (
  input: SaveGeneratedScenariosInput
): Promise<ActionResult<{ count: number }>> => {
  try {
    const parsed = SaveGeneratedScenariosSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error.issues[0]?.message);

    const { projectId, requirementAnalysisId, scenarios } = parsed.data;

    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const storageError = await checkStorageLimit(projectId);
    if (storageError) return storageError;

    const db = getDatabase();
    const now = new Date();

    if (
      requirementAnalysisId &&
      !(await analysisBelongsToProject(db, projectId, requirementAnalysisId))
    ) {
      return invalidInput('대상 기능을 찾을 수 없습니다.');
    }

    const [maxSort] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testScenarios.sort_order}), 0)` })
      .from(testScenarios)
      .where(eq(testScenarios.project_id, projectId));
    let nextSort = (maxSort?.max ?? 0) + 1;

    await db.insert(testScenarios).values(
      scenarios.map((scenario) => ({
        project_id: projectId,
        requirement_analysis_id: requirementAnalysisId ?? null,
        name: scenario.name,
        description: scenario.description || null,
        type: scenario.type,
        related_requirement_ids: scenario.relatedRequirementIds,
        status: 'DRAFT' as const,
        sort_order: nextSort++,
        created_at: now,
        updated_at: now,
      }))
    );

    return { success: true, data: { count: scenarios.length } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'saveGeneratedScenarios' } });
    return { success: false, errors: { _scenario: ['시나리오 저장에 실패했습니다.'] } };
  }
};

/** 시나리오 부분 수정. 전달된 필드만 갱신. */
export const updateScenario = async (
  input: UpdateScenarioInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const parsed = UpdateScenarioSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error.issues[0]?.message);

    const { projectId, id, name, description, type, relatedRequirementIds, status } = parsed.data;

    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const db = getDatabase();

    const patch: Record<string, unknown> = { updated_at: new Date() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description || null;
    if (type !== undefined) patch.type = type;
    if (relatedRequirementIds !== undefined) patch.related_requirement_ids = relatedRequirementIds;
    if (status !== undefined) patch.status = status;

    const updated = await db
      .update(testScenarios)
      .set(patch)
      .where(and(eq(testScenarios.id, id), eq(testScenarios.project_id, projectId)))
      .returning({ id: testScenarios.id });

    if (updated.length === 0) return invalidInput('대상 시나리오를 찾을 수 없습니다.');

    return { success: true, data: { id: updated[0].id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateScenario' } });
    return { success: false, errors: { _scenario: ['시나리오 수정에 실패했습니다.'] } };
  }
};

/** 시나리오 소프트 삭제(lifecycle_status='DELETED'). archived_at 으로 휴지통 잔여일을 계산한다. */
export const deleteScenario = async (
  projectId: string,
  id: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const db = getDatabase();
    const now = new Date();

    const deleted = await db
      .update(testScenarios)
      .set({ lifecycle_status: 'DELETED', archived_at: now, updated_at: now })
      .where(and(eq(testScenarios.id, id), eq(testScenarios.project_id, projectId)))
      .returning({ id: testScenarios.id });

    if (deleted.length === 0) return invalidInput('대상 시나리오를 찾을 수 없습니다.');

    return { success: true, data: { id: deleted[0].id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteScenario' } });
    return { success: false, errors: { _scenario: ['시나리오 삭제에 실패했습니다.'] } };
  }
};

/** 드래그 재정렬. 전달된 순서대로 sort_order 를 일괄 갱신. */
export const reorderScenarios = async (
  input: ReorderScenariosInput
): Promise<ActionResult<{ count: number }>> => {
  try {
    const parsed = ReorderScenariosSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error.issues[0]?.message);

    const { projectId, orders } = parsed.data;

    if (!(await requireProjectAccess(projectId))) return accessDenied();
    if (orders.length === 0) return { success: true, data: { count: 0 } };

    const db = getDatabase();
    const now = new Date();

    // 부분 성공 방지: 전달된 id 가 모두 이 프로젝트의 ACTIVE 시나리오인지 먼저 확인한다.
    // (삭제됐거나 다른 프로젝트의 id 가 섞이면 일부만 갱신돼 순서가 중복/누락될 수 있음)
    const ids = [...new Set(orders.map((o) => o.id))];
    const existing = await db
      .select({ id: testScenarios.id })
      .from(testScenarios)
      .where(
        and(
          eq(testScenarios.project_id, projectId),
          eq(testScenarios.lifecycle_status, 'ACTIVE'),
          inArray(testScenarios.id, ids)
        )
      );
    if (existing.length !== ids.length) {
      return invalidInput('재정렬 대상 시나리오를 찾을 수 없습니다.');
    }

    await db.transaction(async (tx) => {
      for (const { id, sortOrder } of orders) {
        await tx
          .update(testScenarios)
          .set({ sort_order: sortOrder, updated_at: now })
          .where(and(eq(testScenarios.id, id), eq(testScenarios.project_id, projectId)));
      }
    });

    return { success: true, data: { count: orders.length } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'reorderScenarios' } });
    return { success: false, errors: { _scenario: ['시나리오 정렬에 실패했습니다.'] } };
  }
};

/** 시나리오 1건을 test_suites 1건으로 파생 생성. test_scenario_id 로 출처를 잇는다. */
export const generateSuiteFromScenario = async (
  projectId: string,
  id: string
): Promise<ActionResult<{ suiteId: string }>> => {
  try {
    if (!(await requireProjectAccess(projectId))) return accessDenied();

    const storageError = await checkStorageLimit(projectId);
    if (storageError) return storageError;

    const db = getDatabase();

    const [scenario] = await db
      .select()
      .from(testScenarios)
      .where(
        and(
          eq(testScenarios.id, id),
          eq(testScenarios.project_id, projectId),
          eq(testScenarios.lifecycle_status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!scenario) return invalidInput('대상 시나리오를 찾을 수 없습니다.');

    // 이 시나리오에서 파생된 ACTIVE 스위트 1건 조회(멱등 처리용).
    const findExistingActiveSuiteId = async (): Promise<string | undefined> => {
      const [row] = await db
        .select({ id: testSuites.id })
        .from(testSuites)
        .where(
          and(
            eq(testSuites.test_scenario_id, scenario.id),
            eq(testSuites.lifecycle_status, 'ACTIVE')
          )
        )
        .limit(1);
      return row?.id;
    };

    // 멱등: 이미 파생된 ACTIVE 스위트가 있으면 중복 생성하지 않고 기존 것을 반환.
    const existingId = await findExistingActiveSuiteId();
    if (existingId) {
      return {
        success: true,
        data: { suiteId: existingId },
        message: '이미 이 시나리오에서 생성한 스위트가 있습니다.',
      };
    }

    let suiteId: string;
    try {
      suiteId = await db.transaction(async (tx) => {
        const [maxSort] = await tx
          .select({ max: sql<number>`COALESCE(MAX(${testSuites.sort_order}), 0)` })
          .from(testSuites)
          .where(eq(testSuites.project_id, projectId));

        const newSuiteId = crypto.randomUUID();
        const now = new Date();
        await tx.insert(testSuites).values({
          id: newSuiteId,
          project_id: projectId,
          name: scenario.name,
          description: scenario.description || null,
          requirement_analysis_id: scenario.requirement_analysis_id,
          test_scenario_id: scenario.id,
          sort_order: (maxSort?.max ?? 0) + 1,
          lifecycle_status: 'ACTIVE' as const,
          created_at: now,
          updated_at: now,
        });
        return newSuiteId;
      });
    } catch (error) {
      // 동시 호출(TOCTOU)로 유니크 인덱스(test_suites_active_scenario_unq) 위반 시,
      // 먼저 만들어진 스위트를 재조회해 멱등하게 반환한다.
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      if (code === '23505') {
        const racedId = await findExistingActiveSuiteId();
        if (racedId) {
          return {
            success: true,
            data: { suiteId: racedId },
            message: '이미 이 시나리오에서 생성한 스위트가 있습니다.',
          };
        }
      }
      throw error;
    }

    return {
      success: true,
      data: { suiteId },
      message: '시나리오에서 스위트를 생성했습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'generateSuiteFromScenario' } });
    return { success: false, errors: { _scenario: ['스위트 생성에 실패했습니다.'] } };
  }
};
