import { desc } from 'drizzle-orm';

import { getDatabase } from '../client/drizzle';
import { type AdminActivityAction, adminActivityLogs } from '../schema/admin-activity-logs';

/**
 * 백오피스 관리자 활동 로그 기록·조회.
 * service_role(BYPASSRLS) 연결 전제 (RLS deny-anon).
 */

export type AdminActivityInput = {
  action: AdminActivityAction;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

/** 활동 1건 기록. 로깅 실패가 주 동작을 막지 않도록 호출부에서 try/catch 권장. */
export async function recordAdminActivity(input: AdminActivityInput): Promise<void> {
  const db = getDatabase();
  await db.insert(adminActivityLogs).values({
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    target_label: input.targetLabel ?? null,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
  });
}

export type AdminActivityLog = {
  id: string;
  action: AdminActivityAction;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

/** 최신순 활동 로그를 반환한다. */
export async function listAdminActivity(limit = 100): Promise<AdminActivityLog[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(adminActivityLogs)
    .orderBy(desc(adminActivityLogs.created_at))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    ip: row.ip,
    createdAt: row.created_at.toISOString(),
  }));
}
