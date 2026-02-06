import { integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';
import { testSuites } from './test-suites';

export const testCaseResultStatusEnum = ['untested', 'pass', 'fail', 'blocked'] as const;
export type TestCaseResultStatus = (typeof testCaseResultStatusEnum)[number];

export const testCases = pgTable('test_cases', (t) => ({
  id: t.uuid('id').primaryKey(),
  project_id: t.uuid('project_id').references(() => projects.id),
  test_suite_id: t.uuid('test_suite_id').references(() => testSuites.id, { onDelete: 'set null' }),
  name: t.varchar('name').notNull(),
  steps: t.text('steps'),
  test_type: t.varchar('test_type'),
  case_key: t.varchar('case_key'),
  pre_condition: t.text('pre_condition'),
  tags: t.text('tags').array(10),
  expected_result: t.text('expected_result'),
  sort_order: t.integer('sort_order'),
  result_status: t.varchar('result_status', { length: 20 }).$type<TestCaseResultStatus>().default('untested').notNull(),
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t.timestamp('updated_at').defaultNow().notNull(),
  archived_at: t.timestamp('archived_at'),
  lifecycle_status: t.varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
}), (t) => ({
    unq: unique().on(t.project_id, t.name),
}));
