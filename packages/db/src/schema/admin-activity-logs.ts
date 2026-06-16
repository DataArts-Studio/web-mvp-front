import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * 백오피스 관리자 활동 로그 액션.
 *
 * - login: 운영자 게이트 통과(접속)
 * - login.failed: 게이트 인증 실패(브루트포스 추적·락아웃 판단용)
 * - notice.*: 공지 생성·수정·활성/비활성·삭제
 */
export const adminActivityActionEnum = [
  'login',
  'login.failed',
  'notice.create',
  'notice.update',
  'notice.activate',
  'notice.deactivate',
  'notice.delete',
] as const;
export type AdminActivityAction = (typeof adminActivityActionEnum)[number];

/**
 * admin_activity_logs: 백오피스 운영자의 접속·이벤트 기록.
 *
 * - 사용자 계정 체계가 없어(공유키 게이트) 현재 actor 식별자는 없고 IP 만 남긴다.
 *   정식 RBAC 도입 시 actor 컬럼을 추가한다.
 * - target_*: 대상 리소스(예: notice) 식별. 로그인 등 대상이 없는 액션은 NULL.
 * - RLS: anon deny-all. 서버(service_role) 경유로만 기록·조회.
 */
export const adminActivityLogs = pgTable(
  'admin_activity_logs',
  (t) => ({
    id: t.uuid('id').primaryKey().defaultRandom(),
    /** 행위자 식별(Cloudflare Access 인증 이메일). 공유키 게이트(로컬)면 NULL. */
    actor: t.text('actor'),
    action: t.varchar('action', { length: 40 }).$type<AdminActivityAction>().notNull(),
    target_type: t.varchar('target_type', { length: 50 }),
    target_id: t.uuid('target_id'),
    target_label: t.text('target_label'),
    metadata: t.jsonb('metadata'),
    ip: t.varchar('ip', { length: 64 }),
    created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => ({
    createdIdx: index('admin_activity_logs_created_idx').on(t.created_at),
  })
);
