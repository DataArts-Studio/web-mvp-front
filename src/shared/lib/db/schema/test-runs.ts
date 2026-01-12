import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';

export const testRunStatusEnum = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TestRunStatus = (typeof testRunStatusEnum)[number];

export const testRuns = pgTable('test_runs', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  name: varchar('name').notNull(),
  description: text('description'),
  status: varchar('status').$type<TestRunStatus>().default('NOT_STARTED').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  archived_at: timestamp('archived_at'),
  lifecycle_status: varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
});