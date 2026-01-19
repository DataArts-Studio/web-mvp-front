import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const lifecycleStatusEnum = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const;
export type LifecycleStatus = (typeof lifecycleStatusEnum)[number];

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  /** 프로젝트 접근 비밀번호의 bcrypt 해시. 원문은 저장하지 않음. */
  identifier: varchar('identifier', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  owner_name: varchar('owner_name', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  archived_at: timestamp('archived_at'),
  lifecycle_status: varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
});