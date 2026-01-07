import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { testCaseRuns } from './test-case-runs';
import { suiteTestCases } from './suite-test-cases';

export const testCases = pgTable('test_cases', (t) => ({
  id: t.uuid('id').primaryKey(),
  project_id: t.uuid('project_id').references(() => projects.id),
  name: t.varchar('name').notNull(),
  steps: t.text('steps'),
  test_type: t.varchar('test_type'),
  case_key: t.varchar('case_key'),
  pre_condition: t.text('pre_condition'),
  tags: t.text('tags').array(10),
  expected_result: t.text('expected_result'),
  sort_order: t.integer('sort_order'),
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t.timestamp('updated_at').defaultNow().notNull(),
  deleted_at: t.timestamp('deleted_at'),
}), (t) => ({
    unq: unique().on(t.project_id, t.name),
}));

export const testCaseRelations = relations(testCases, ({ one, many }) => ({
  project: one(projects, {
    fields: [testCases.project_id],
    references: [projects.id],
  }),
  testCaseRuns: many(testCaseRuns),
  suiteTestCases: many(suiteTestCases),
}));
