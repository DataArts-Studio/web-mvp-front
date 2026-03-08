'use server';

import * as Sentry from '@sentry/nextjs';
import { and, eq, sql } from 'drizzle-orm';
import { getDatabase, projectAiConfigs, testCases } from '@/shared/lib/db';
import { encrypt, decrypt } from '@/shared/lib/crypto';
import type { ActionResult } from '@/shared/types';
import type { AiConfig } from '../model/types';
import { SaveAiConfigSchema, SaveGeneratedCasesSchema } from '../model/schema';

// --- AI 설정 저장/업데이트 ---
export const saveAiConfig = async (
  input: { projectId: string; provider: string; apiKey: string; model?: string },
): Promise<ActionResult<{ config: AiConfig }>> => {
  try {
    const parsed = SaveAiConfigSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _ai: [parsed.error.errors[0].message] } };
    }

    const { projectId, provider, apiKey, model } = parsed.data;
    const encryptedKey = encrypt(apiKey);
    const db = getDatabase();

    const [existing] = await db
      .select({ id: projectAiConfigs.id })
      .from(projectAiConfigs)
      .where(and(eq(projectAiConfigs.project_id, projectId), eq(projectAiConfigs.lifecycle_status, 'ACTIVE')))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(projectAiConfigs)
        .set({
          provider,
          api_key: encryptedKey,
          model: model || null,
          updated_at: new Date(),
        })
        .where(eq(projectAiConfigs.id, existing.id))
        .returning();

      return {
        success: true,
        data: {
          config: {
            id: updated.id,
            projectId: updated.project_id,
            provider: updated.provider,
            model: updated.model,
            hasApiKey: true,
            createdAt: updated.created_at.toISOString(),
            updatedAt: updated.updated_at.toISOString(),
          },
        },
      };
    }

    const [created] = await db
      .insert(projectAiConfigs)
      .values({
        project_id: projectId,
        provider,
        api_key: encryptedKey,
        model: model || null,
      })
      .returning();

    return {
      success: true,
      data: {
        config: {
          id: created.id,
          projectId: created.project_id,
          provider: created.provider,
          model: created.model,
          hasApiKey: true,
          createdAt: created.created_at.toISOString(),
          updatedAt: created.updated_at.toISOString(),
        },
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'saveAiConfig' } });
    return { success: false, errors: { _ai: ['AI 설정 저장에 실패했습니다.'] } };
  }
};

// --- AI 설정 조회 ---
export const getAiConfig = async (
  projectId: string,
): Promise<ActionResult<AiConfig | null>> => {
  try {
    const db = getDatabase();

    const [config] = await db
      .select({
        id: projectAiConfigs.id,
        project_id: projectAiConfigs.project_id,
        provider: projectAiConfigs.provider,
        model: projectAiConfigs.model,
        created_at: projectAiConfigs.created_at,
        updated_at: projectAiConfigs.updated_at,
      })
      .from(projectAiConfigs)
      .where(and(eq(projectAiConfigs.project_id, projectId), eq(projectAiConfigs.lifecycle_status, 'ACTIVE')))
      .limit(1);

    if (!config) return { success: true, data: null };

    return {
      success: true,
      data: {
        id: config.id,
        projectId: config.project_id,
        provider: config.provider,
        model: config.model,
        hasApiKey: true,
        createdAt: config.created_at.toISOString(),
        updatedAt: config.updated_at.toISOString(),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getAiConfig' } });
    return { success: false, errors: { _ai: ['AI 설정을 불러올 수 없습니다.'] } };
  }
};

// --- AI 설정에서 복호화된 키 조회 (내부용) ---
export const getDecryptedApiKey = async (
  projectId: string,
): Promise<{ provider: string; apiKey: string; model: string | null } | null> => {
  const db = getDatabase();

  const [config] = await db
    .select()
    .from(projectAiConfigs)
    .where(and(eq(projectAiConfigs.project_id, projectId), eq(projectAiConfigs.lifecycle_status, 'ACTIVE')))
    .limit(1);

  if (!config) return null;

  return {
    provider: config.provider,
    apiKey: decrypt(config.api_key),
    model: config.model,
  };
};

// --- AI 설정 삭제 (소프트 딜리트) ---
export const deleteAiConfig = async (
  projectId: string,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();
    await db
      .update(projectAiConfigs)
      .set({ lifecycle_status: 'DELETED', updated_at: new Date() })
      .where(and(eq(projectAiConfigs.project_id, projectId), eq(projectAiConfigs.lifecycle_status, 'ACTIVE')));
    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteAiConfig' } });
    return { success: false, errors: { _ai: ['AI 설정 삭제에 실패했습니다.'] } };
  }
};

// --- AI 생성된 TC 일괄 저장 ---
export const saveGeneratedCases = async (
  input: { projectId: string; suiteId?: string; cases: { name: string; preCondition?: string; steps?: string; expectedResult?: string; tags?: string[] }[] },
): Promise<ActionResult<{ count: number }>> => {
  try {
    const parsed = SaveGeneratedCasesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _ai: [parsed.error.errors[0].message] } };
    }

    const { projectId, suiteId, cases } = parsed.data;
    const db = getDatabase();

    // display_id 최대값 조회
    const [maxDisplayId] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
      .from(testCases)
      .where(eq(testCases.project_id, projectId));

    let nextDisplayId = (maxDisplayId?.max ?? 0) + 1;

    await db.insert(testCases).values(
      cases.map((tc) => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        test_suite_id: suiteId ?? null,
        name: tc.name,
        pre_condition: tc.preCondition || null,
        steps: tc.steps || null,
        expected_result: tc.expectedResult || null,
        tags: [...(tc.tags || []), 'ai-generated'],
        display_id: nextDisplayId++,
        sort_order: 0,
        result_status: 'untested' as const,
      })),
    );

    return { success: true, data: { count: cases.length } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'saveGeneratedCases' } });
    return { success: false, errors: { _ai: ['TC 저장에 실패했습니다.'] } };
  }
};
