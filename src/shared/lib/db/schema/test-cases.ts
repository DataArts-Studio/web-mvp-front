import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';



import { projects } from './projects';
import { testSuite } from './test-suites';

// CHECK ((status = ANY (ARRAY['untested'::text, 'pass'::text, 'fail'::text, 'blocked'::text])))
export const testCases = pgTable('test_cases', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  test_suite_id: uuid('test_suite_id').references(() => testSuite.id),
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

export const testCaseRelations = relations(testCases, ({ one }) => ({
  project: one(projects, {
    fields: [testCases.project_id],
    references: [projects.id],
  }),
  testSuite: one(testSuite, {
    fields: [testCases.test_suite_id],
    references: [testSuite.id],
  }),
}));
