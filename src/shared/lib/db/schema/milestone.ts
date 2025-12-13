import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { project } from './project';
import { relations } from 'drizzle-orm';

export const milestone = pgTable('milestone', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => project.id),
  name: varchar('name').notNull(),
  description: varchar('description'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  status: varchar('status').notNull(),
  create_at: timestamp().defaultNow().notNull(),
  update_at: timestamp().defaultNow().notNull(),
  delete_at: timestamp(),
});

export const milestoneRelations = relations(milestone, ({ one }) => ({
  project: one(project, {
    fields: [milestone.project_id],
    references: [project.id],
  }),
}));