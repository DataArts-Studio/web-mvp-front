import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * audit_logs: 영구 삭제 전 데이터 스냅샷을 보존합니다.
 *
 * - 영구 삭제(permanent delete), 휴지통 비우기(empty trash), 자동 정리(auto cleanup) 시 기록
 * - entity_type: 'test_case' | 'test_suite' | 'milestone'
 * - action: 'permanent_delete' | 'auto_cleanup' | 'empty_trash'
 * - snapshot: 삭제 시점의 전체 row를 JSON으로 보존
 * - 보존 기간: 5년 (법적 보존 기간, 별도 배치로 정리)
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  entity_type: varchar('entity_type', { length: 50 }).notNull(),
  entity_id: uuid('entity_id').notNull(),
  entity_name: varchar('entity_name', { length: 500 }),
  action: varchar('action', { length: 50 }).notNull(),
  snapshot: jsonb('snapshot').notNull(),
  deleted_at: timestamp('deleted_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
