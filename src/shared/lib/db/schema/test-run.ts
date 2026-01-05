import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { milestones } from './milestones';
import { projects } from './projects';

export const testRunStatus = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TestRunStatus = (typeof testRunStatus)[number];

export const testRunSourceType = ['SUITE', 'MILESTONE', 'ADHOC'] as const;
export type TestRunSourceType = (typeof testRunSourceType)[number];

export const testRun = pgTable('test_run', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  milestone_id: uuid('milestone_id').references(() => milestones.id),
  run_name: varchar('run_name').notNull(),
  status: varchar('status').$type<TestRunStatus>().default('NOT_STARTED').notNull(),
  source_type: varchar('source_type').$type<TestRunSourceType>().notNull(),
  started_at: timestamp('started_at'),
  ended_at: timestamp('ended_at'),
  create_at: timestamp().defaultNow().notNull(),
  update_at: timestamp().defaultNow().notNull(),
  delete_at: timestamp(),
});

export const testRunRelations = relations(testRun, ({ one }) => ({
  project: one(projects, {
    fields: [testRun.project_id],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [testRun.milestone_id],
    references: [milestones.id],
  }),
}));