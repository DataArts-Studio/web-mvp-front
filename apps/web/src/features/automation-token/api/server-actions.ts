'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, projectAutomationTokens } from '@testea/db';
import { eq } from 'drizzle-orm';

import { generateAutomationToken } from '../lib/token';

export interface AutomationTokenStatus {
  exists: boolean;
  prefix: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
}

/**
 * 현재 발급된 자동화 토큰의 메타데이터(평문 제외) 반환.
 * 토큰이 아직 없으면 `exists: false` 로 응답.
 */
export const getAutomationTokenStatus = async (
  projectId: string
): Promise<ActionResult<AutomationTokenStatus>> => {
  try {
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(projectAutomationTokens)
      .where(eq(projectAutomationTokens.project_id, projectId))
      .limit(1);

    if (!row) {
      return {
        success: true,
        data: { exists: false, prefix: null, lastUsedAt: null, createdAt: null },
      };
    }

    return {
      success: true,
      data: {
        exists: true,
        prefix: row.token_prefix,
        lastUsedAt: row.last_used_at ? row.last_used_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getAutomationTokenStatus' } });
    return { success: false, errors: { _general: ['토큰 상태 조회에 실패했습니다.'] } };
  }
};

/**
 * 자동화 토큰을 새로 발급한다.
 *
 * - 단일 토큰 정책: 기존 토큰이 있으면 새 값으로 덮어쓴다 (재발급 = 회수 + 발급).
 * - 응답에는 평문이 1회 포함된다. DB 에는 hash 만 저장.
 */
export const issueAutomationToken = async (
  projectId: string
): Promise<ActionResult<{ plaintext: string; prefix: string }>> => {
  try {
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const { plaintext, prefix, hash } = generateAutomationToken();

    await db
      .insert(projectAutomationTokens)
      .values({ project_id: projectId, token_prefix: prefix, token_hash: hash })
      .onConflictDoUpdate({
        target: projectAutomationTokens.project_id,
        set: {
          token_prefix: prefix,
          token_hash: hash,
          last_used_at: null,
          created_at: new Date(),
        },
      });

    return { success: true, data: { plaintext, prefix }, message: '토큰이 발급되었습니다.' };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'issueAutomationToken' } });
    return { success: false, errors: { _general: ['토큰 발급에 실패했습니다.'] } };
  }
};

/**
 * 자동화 토큰을 회수한다. 회수 즉시 해당 토큰의 후속 요청은 거부된다.
 */
export const revokeAutomationToken = async (
  projectId: string
): Promise<ActionResult<{ revoked: boolean }>> => {
  try {
    if (!(await requireProjectAccess(projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }
    const db = getDatabase();
    const deleted = await db
      .delete(projectAutomationTokens)
      .where(eq(projectAutomationTokens.project_id, projectId))
      .returning({ projectId: projectAutomationTokens.project_id });

    return { success: true, data: { revoked: deleted.length > 0 } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'revokeAutomationToken' } });
    return { success: false, errors: { _general: ['토큰 회수에 실패했습니다.'] } };
  }
};
