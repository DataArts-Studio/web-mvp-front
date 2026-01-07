import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { testCaseRuns, testRunMilestones, testRunSuites } from '@/shared/lib/db';

export const testRuns = pgTable('test_runs', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  name: varchar('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});

export const testRunRelations = relations(testRuns, ({ one, many }) => ({
  project: one(projects, {
    fields: [testRuns.project_id],
    references: [projects.id],
  }),
  testCaseRuns: many(testCaseRuns),
  testRunSuites: many(testRunSuites),
  testRunMilestones: many(testRunMilestones),
}));
