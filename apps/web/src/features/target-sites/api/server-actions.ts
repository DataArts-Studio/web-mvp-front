'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, targetSites } from '@testea/db';
import { and, asc, eq } from 'drizzle-orm';

import { encryptAuthSecret } from '../lib/auth-secret';
import {
  CreateTargetSiteSchema,
  DeleteTargetSiteSchema,
  UpdateTargetSiteSchema,
} from '../model/schema';
import type { TargetSite } from '../model/types';

/**
 * DB row → 클라이언트 노출 형태.
 * 시크릿 평문은 절대 내려보내지 않고 존재 여부(hasAuth)만 표시한다.
 */
function toTargetSite(row: {
  id: string;
  project_id: string;
  name: string;
  base_url: string;
  auth_secret_encrypted: string | null;
  created_at: Date;
  updated_at: Date;
}): TargetSite {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    baseUrl: row.base_url,
    hasAuth: row.auth_secret_encrypted != null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// 조회는 ciphertext 컬럼을 select 하더라도 toTargetSite 매핑에서 평문을 만들지 않고
// 존재 여부(hasAuth boolean)로만 변환하므로 시크릿이 클라이언트로 새지 않는다.

/** 테스트 대상 등록. 인증 시크릿은 암호화해 저장. */
export const createTargetSite = async (input: {
  projectId: string;
  name: string;
  baseUrl: string;
  auth?: {
    username?: string;
    password?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  };
}): Promise<ActionResult<{ targetSite: TargetSite }>> => {
  try {
    const parsed = CreateTargetSiteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _targetSite: [parsed.error.errors[0].message] } };
    }

    const { projectId, name, baseUrl, auth } = parsed.data;

    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const [row] = await db
      .insert(targetSites)
      .values({
        project_id: projectId,
        name,
        base_url: baseUrl,
        auth_secret_encrypted: encryptAuthSecret(auth),
      })
      .returning();

    return { success: true, data: { targetSite: toTargetSite(row) } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTargetSite' } });
    return { success: false, errors: { _targetSite: ['테스트 대상 등록에 실패했습니다.'] } };
  }
};

/** 프로젝트의 테스트 대상 목록. 시크릿 평문 미포함(hasAuth 만). */
export const listTargetSites = async (projectId: string): Promise<ActionResult<TargetSite[]>> => {
  try {
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const rows = await db
      .select()
      .from(targetSites)
      .where(eq(targetSites.project_id, projectId))
      .orderBy(asc(targetSites.created_at));

    return { success: true, data: rows.map(toTargetSite) };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'listTargetSites' } });
    return { success: false, errors: { _targetSite: ['테스트 대상을 불러올 수 없습니다.'] } };
  }
};

/**
 * 테스트 대상 수정.
 * auth: undefined=유지, null=제거, 객체=교체.
 */
export const updateTargetSite = async (input: {
  projectId: string;
  targetSiteId: string;
  name?: string;
  baseUrl?: string;
  auth?: {
    username?: string;
    password?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } | null;
}): Promise<ActionResult<{ targetSite: TargetSite }>> => {
  try {
    const parsed = UpdateTargetSiteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _targetSite: [parsed.error.errors[0].message] } };
    }

    const { projectId, targetSiteId, name, baseUrl, auth } = parsed.data;

    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();

    const set: {
      name?: string;
      base_url?: string;
      auth_secret_encrypted?: string | null;
      updated_at: Date;
    } = { updated_at: new Date() };

    if (name !== undefined) set.name = name;
    if (baseUrl !== undefined) set.base_url = baseUrl;
    // auth 키가 input 에 실제로 들어온 경우에만 시크릿을 손댄다.
    // (undefined 면 기존 유지, null 이면 제거, 객체면 교체)
    if ('auth' in input) {
      set.auth_secret_encrypted = auth == null ? null : encryptAuthSecret(auth);
    }

    const [row] = await db
      .update(targetSites)
      .set(set)
      // project_id 까지 조건에 넣어 타 프로젝트 row 수정 차단(소유 검증 이중화).
      .where(and(eq(targetSites.id, targetSiteId), eq(targetSites.project_id, projectId)))
      .returning();

    if (!row) {
      return { success: false, errors: { _targetSite: ['테스트 대상을 찾을 수 없습니다.'] } };
    }

    return { success: true, data: { targetSite: toTargetSite(row) } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTargetSite' } });
    return { success: false, errors: { _targetSite: ['테스트 대상 수정에 실패했습니다.'] } };
  }
};

/** 테스트 대상 삭제. */
export const deleteTargetSite = async (input: {
  projectId: string;
  targetSiteId: string;
}): Promise<ActionResult<{ deleted: boolean }>> => {
  try {
    const parsed = DeleteTargetSiteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _targetSite: [parsed.error.errors[0].message] } };
    }

    const { projectId, targetSiteId } = parsed.data;

    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const deleted = await db
      .delete(targetSites)
      .where(and(eq(targetSites.id, targetSiteId), eq(targetSites.project_id, projectId)))
      .returning({ id: targetSites.id });

    return { success: true, data: { deleted: deleted.length > 0 } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'deleteTargetSite' } });
    return { success: false, errors: { _targetSite: ['테스트 대상 삭제에 실패했습니다.'] } };
  }
};
