import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { project } from './project';
import { suite } from './test-suite';
// CHECK ((status = ANY (ARRAY['untested'::text, 'pass'::text, 'fail'::text, 'blocked'::text])))
export const testCase = pgTable('test_cases', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => project.id),
  test_suite_id: uuid('test_suite_id').references(() => suite.id),
  name: varchar('name').notNull(),
  steps: text('steps'),
  test_type: varchar('test_type'),
  case_key: varchar('case_key'),
  pre_condition: text('pre_condition'),
  tags: text('tags').array(10),
  expected_result: text('expected_result'),
  sort_order: integer('sort_order'),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
});

export const testCaseRelations = relations(testCase, ({ one }) => ({
  project: one(project, {
    fields: [testCase.project_id],
    references: [project.id],
  }),
  suite: one(suite, {
    fields: [testCase.test_suite_id],
    references: [suite.id],
  }),
}));
