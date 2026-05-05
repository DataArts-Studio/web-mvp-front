import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const lifecycleStatusEnum = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const;
export type LifecycleStatus = (typeof lifecycleStatusEnum)[number];

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  /** 프로젝트 접근 비밀번호의 bcrypt 해시. 원문은 저장하지 않음. */
  identifier: text('identifier').notNull(),
  description: text('description'),
  owner_name: text('owner_name'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archived_at: timestamp('archived_at', { withTimezone: true }),
  lifecycle_status: varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
});