import { relations } from 'drizzle-orm';
import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { testRunSuites } from './test-run-suites';
import { suiteTestCases } from './suite-test-cases';

export const testSuite = pgTable('test_suites', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  name: varchar('name').notNull(),
  description: varchar('description'),
  sort_order: integer('sort_order'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});

export const testSuiteRelations = relations(testSuite, ({ many }) => ({
    testRunSuites: many(testRunSuites),
    suiteTestCases: many(suiteTestCases),
}));
