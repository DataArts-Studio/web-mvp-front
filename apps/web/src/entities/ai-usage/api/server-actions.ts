'use server';

import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { aiUsageLogs, getDatabase } from '@testea/db';
import { and, eq, gte, sql } from 'drizzle-orm';

const FREE_MONTHLY_LIMIT = 50;

/**
 * 이번 달 1일 00:00:00 UTC. 사용량 합산의 하한 경계. 검사·기록이 같은 경계를 쓰도록 공유한다.
 * created_at 이 timestamptz(UTC) 이므로 경계도 UTC 로 잡아, 서버 로컬 타임존에 따라
 * 월말 일부 기록이 누락/중복 집계되지 않게 한다.
 */
const startOfCurrentMonth = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

export const getMonthlyUsage = async (
  projectId: string
): Promise<ActionResult<{ used: number; limit: number }>> => {
  try {
    const db = getDatabase();

    const startOfMonth = startOfCurrentMonth();

    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${aiUsageLogs.generated_count}), 0)`,
      })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.project_id, projectId), gte(aiUsageLogs.created_at, startOfMonth)));

    return {
      success: true,
      data: {
        used: Number(result?.total ?? 0),
        limit: FREE_MONTHLY_LIMIT,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMonthlyUsage' } });
    return { success: false, errors: { _ai: ['사용량 조회에 실패했습니다.'] } };
  }
};

export interface AttachmentUsageMeta {
  type: 'pdf' | 'markdown';
  sizeBytes: number;
  /** PDF 일 때만 값 있음. Markdown 은 null. */
  pageCount: number | null;
  charCount: number;
}

export interface UsageGrant {
  /** 이번 요청에 실제 집계(채택)된 건수. 남은 한도를 넘지 않도록 잘린 값. */
  granted: number;
  /** 집계 반영 후 이번 달 누적 사용량. */
  used: number;
  limit: number;
}

/**
 * 월 사용 한도를 원자적으로 선점하며 사용량을 기록한다.
 *
 * 사용량은 로그 합산 방식이라 선점할 단일 카운터 행이 없어, 검사(합산)와 기록(INSERT)이
 * 분리되면 동시 요청이 같은 잔여량을 보고 각각 기록해 한도를 초과할 수 있다(TOCTOU).
 * 트랜잭션 안에서 프로젝트 단위 advisory lock 으로 검사·기록 구간을 직렬화해 이를 막는다.
 * (xact 레벨이라 트랜잭션 종료 시 자동 해제되고 pgBouncer transaction pooling 과도 호환)
 *
 * 잔여 한도보다 많이 요청하면 잔여분만 채택해 기록하고, 채택된 건수(`granted`)를 돌려준다.
 * 호출부는 `granted` 만큼만 사용자에게 반환하면 된다.
 */
export const recordUsageAtomic = async (
  projectId: string,
  actionType: string,
  requestedCount: number,
  attachment?: AttachmentUsageMeta
): Promise<ActionResult<UsageGrant>> => {
  const requested = Math.max(0, Math.trunc(requestedCount));
  try {
    const db = getDatabase();
    const startOfMonth = startOfCurrentMonth();

    const grant = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('ai_usage_monthly'), hashtext(${projectId}))`
      );

      const [row] = await tx
        .select({
          total: sql<number>`COALESCE(SUM(${aiUsageLogs.generated_count}), 0)`,
        })
        .from(aiUsageLogs)
        .where(
          and(eq(aiUsageLogs.project_id, projectId), gte(aiUsageLogs.created_at, startOfMonth))
        );

      const used = Number(row?.total ?? 0);
      const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
      const granted = Math.min(requested, remaining);

      if (granted > 0) {
        await tx.insert(aiUsageLogs).values({
          project_id: projectId,
          action_type: actionType,
          generated_count: granted,
          attached_file_type: attachment?.type ?? null,
          attached_file_size_bytes: attachment?.sizeBytes ?? null,
          attached_file_page_count: attachment?.pageCount ?? null,
          attached_file_char_count: attachment?.charCount ?? null,
        });
      }

      return { granted, used: used + granted, limit: FREE_MONTHLY_LIMIT } satisfies UsageGrant;
    });

    return { success: true, data: grant };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'recordUsageAtomic' } });
    return { success: false, errors: { _ai: ['사용량 기록에 실패했습니다.'] } };
  }
};
