'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  type RequirementAnalysisDocument,
  aiRequirementAnalyses,
  getDatabase,
  testScenarios,
  testSuites,
} from '@testea/db';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  CreateFeatureSchema,
  type GeneratedScenario,
  type RequirementAnalysis,
  SaveRequirementAnalysisSchema,
} from '../model/schema';
import type { RequirementAnalysisListItem } from '../model/types';

/**
 * AI 요구사항 분석 결과 저장.
 *
 * 분석서 전체(분석 섹션 + 생성된 시나리오 원본)를 ai_requirement_analyses 한 행으로 영속화하고,
 * 사용자가 선택한 시나리오만 test_suites 로 만들어 requirement_analysis_id 로 출처를 잇는다.
 */
export const saveRequirementAnalysis = async (input: {
  projectId: string;
  sourceInput: string;
  language?: 'ko' | 'en';
  analysis: RequirementAnalysis;
  scenarios: GeneratedScenario[];
  selectedScenarioIndices?: number[];
  attachment?: { type: 'pdf' | 'markdown'; charCount: number } | null;
}): Promise<ActionResult<{ analysisId: string; scenarioCount: number; suiteCount: number }>> => {
  try {
    const parsed = SaveRequirementAnalysisSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errors: { _ai: [parsed.error.issues[0]?.message ?? '입력 값이 올바르지 않습니다.'] },
      };
    }

    const {
      projectId,
      sourceInput,
      language,
      analysis,
      scenarios,
      selectedScenarioIndices,
      attachment,
    } = parsed.data;

    // 임의 projectId 로 다른 프로젝트에 스위트를 만들지 못하도록 접근 가드.
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _ai: ['프로젝트 접근 권한이 없습니다.'] } };
    }

    // 스위트 생성 경로(createTestSuite)와 동일하게 용량 한도를 먼저 가드한다.
    const storageError = await checkStorageLimit(projectId);
    if (storageError) return storageError;

    const document: RequirementAnalysisDocument = { ...analysis, scenarios };

    // 중복 인덱스가 오면 같은 시나리오가 여러 스위트로 생성되므로 set 으로 한 번 걸러낸다.
    const selectedIndices = [...new Set(selectedScenarioIndices ?? scenarios.map((_, i) => i))]
      .filter((i) => i >= 0 && i < scenarios.length)
      .sort((a, b) => a - b);

    const db = getDatabase();
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      const [analysisRow] = await tx
        .insert(aiRequirementAnalyses)
        .values({
          project_id: projectId,
          title: analysis.title,
          source_input: sourceInput,
          analysis: document,
          language,
          attached_file_type: attachment?.type ?? null,
          attached_file_char_count: attachment?.charCount ?? null,
        })
        .returning({ id: aiRequirementAnalyses.id });

      const analysisId = analysisRow.id;

      // 생성된 모든 시나리오를 1급 엔티티(test_scenarios)로 영속화한다.
      // 입력 순서대로 insert → returning 도 같은 순서이므로 인덱스로 행 id 를 매핑한다.
      const [maxScenarioSort] = await tx
        .select({ max: sql<number>`COALESCE(MAX(${testScenarios.sort_order}), 0)` })
        .from(testScenarios)
        .where(eq(testScenarios.project_id, projectId));
      let nextScenarioSort = (maxScenarioSort?.max ?? 0) + 1;

      const insertedScenarios = await tx
        .insert(testScenarios)
        .values(
          scenarios.map((scenario) => ({
            project_id: projectId,
            requirement_analysis_id: analysisId,
            name: scenario.name,
            description: scenario.description || null,
            type: scenario.type,
            related_requirement_ids: scenario.relatedRequirementIds ?? [],
            status: 'DRAFT' as const,
            sort_order: nextScenarioSort++,
            created_at: now,
            updated_at: now,
          }))
        )
        .returning({ id: testScenarios.id });

      // 선택한 시나리오는 하위호환을 위해 즉시 스위트로도 변환하고, 출처 시나리오를 잇는다.
      if (selectedIndices.length > 0) {
        const [maxSuiteSort] = await tx
          .select({ max: sql<number>`COALESCE(MAX(${testSuites.sort_order}), 0)` })
          .from(testSuites)
          .where(eq(testSuites.project_id, projectId));

        let nextSuiteSort = (maxSuiteSort?.max ?? 0) + 1;

        await tx.insert(testSuites).values(
          selectedIndices.map((i) => ({
            id: crypto.randomUUID(),
            project_id: projectId,
            name: scenarios[i].name,
            description: scenarios[i].description || null,
            requirement_analysis_id: analysisId,
            test_scenario_id: insertedScenarios[i].id,
            sort_order: nextSuiteSort++,
            lifecycle_status: 'ACTIVE' as const,
            created_at: now,
            updated_at: now,
          }))
        );
      }

      return {
        analysisId,
        scenarioCount: insertedScenarios.length,
        suiteCount: selectedIndices.length,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'saveRequirementAnalysis' } });
    return { success: false, errors: { _ai: ['요구사항 분석 저장에 실패했습니다.'] } };
  }
};

/**
 * 빈 기능(요구사항) 생성. AI 분석 없이 제목만으로 시나리오를 담을 컨테이너를 만든다.
 * analysis JSONB 는 빈 문서로 채운다.
 */
export const createFeature = async (input: {
  projectId: string;
  title: string;
}): Promise<ActionResult<{ id: string }>> => {
  try {
    const parsed = CreateFeatureSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errors: { _ai: [parsed.error.issues[0]?.message ?? '입력 값이 올바르지 않습니다.'] },
      };
    }
    const { projectId, title } = parsed.data;

    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _ai: ['프로젝트 접근 권한이 없습니다.'] } };
    }

    const document: RequirementAnalysisDocument = {
      title,
      summary: '',
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      constraints: [],
      assumptions: [],
      openQuestions: [],
      scenarios: [],
    };

    const db = getDatabase();
    const [row] = await db
      .insert(aiRequirementAnalyses)
      .values({ project_id: projectId, title, source_input: title, analysis: document })
      .returning({ id: aiRequirementAnalyses.id });

    return { success: true, data: { id: row.id } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createFeature' } });
    return { success: false, errors: { _ai: ['기능 생성에 실패했습니다.'] } };
  }
};

/**
 * 프로젝트의 요구사항 분석 산출물 목록 (요구사항 생성 페이지용).
 * 최신순. 각 분석서에서 스위트로 저장된 시나리오 수를 함께 집계한다.
 */
export const getRequirementAnalyses = async (
  projectId: string
): Promise<ActionResult<RequirementAnalysisListItem[]>> => {
  try {
    // 프로젝트 내부 산출물(원본 입력·요약·시나리오 수)을 노출하므로 조회도 접근 가드.
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _ai: ['프로젝트 접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const rows = await db
      .select()
      .from(aiRequirementAnalyses)
      .where(
        and(
          eq(aiRequirementAnalyses.project_id, projectId),
          eq(aiRequirementAnalyses.lifecycle_status, 'ACTIVE')
        )
      )
      .orderBy(desc(aiRequirementAnalyses.created_at));

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    const ids = rows.map((r) => r.id);
    const suiteCountRows = await db
      .select({ analysisId: testSuites.requirement_analysis_id, cnt: count() })
      .from(testSuites)
      .where(
        and(
          inArray(testSuites.requirement_analysis_id, ids),
          eq(testSuites.lifecycle_status, 'ACTIVE')
        )
      )
      .groupBy(testSuites.requirement_analysis_id);

    const suiteCountMap = new Map(suiteCountRows.map((r) => [r.analysisId, Number(r.cnt)]));

    const data: RequirementAnalysisListItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.analysis.summary ?? '',
      language: row.language,
      scenarioCount: row.analysis.scenarios?.length ?? 0,
      functionalCount: row.analysis.functionalRequirements?.length ?? 0,
      savedSuiteCount: suiteCountMap.get(row.id) ?? 0,
      createdAt: row.created_at.toISOString(),
    }));

    return { success: true, data };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getRequirementAnalyses' } });
    return { success: false, errors: { _ai: ['요구사항 분석 목록을 불러오지 못했습니다.'] } };
  }
};
