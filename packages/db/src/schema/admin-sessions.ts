import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** 관리자 난수 세션의 SHA-256만 저장한다. 원문 쿠키·공유키는 저장하지 않는다. */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    token_hash: text('token_hash').primaryKey(),
    secret_version: text('secret_version').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('admin_sessions_expires_idx').on(t.expires_at)]
);
