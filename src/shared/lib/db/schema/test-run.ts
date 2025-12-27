import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { milestone } from './milestone';
import { projects } from './projects';

export const testRun = pgTable('test_run', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  milestone_id: uuid('milestone_id').references(() => milestone.id),
  run_name: varchar('run_name').notNull(),
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
  milestone: one(milestone, {
    fields: [testRun.milestone_id],
    references: [milestone.id],
  }),
}));