import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { project } from './project';
import { suite } from './test-suite';
import { relations } from 'drizzle-orm';

export const testCase = pgTable('test_case', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => project.id),
  test_suite_id: uuid('test_suite_id').references(() => suite.id),
  name: varchar('name').notNull(),
  steps: text('steps'),
  expected_result: text('expected_result'),
  sort_order: integer('sort_order'),
  create_at: timestamp().defaultNow().notNull(),
  update_at: timestamp().defaultNow().notNull(),
  delete_at: timestamp(),
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