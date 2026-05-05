import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';

export const milestoneProgressStatusEnum = ['planned', 'inProgress', 'done'] as const;
export type MilestoneProgressStatus = (typeof milestoneProgressStatusEnum)[number];

export const milestones = pgTable('milestones', (t) => ({
  id: t.uuid('id').primaryKey(),
  project_id: t.uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: t.varchar('name', { length: 255 }).notNull(),
  description: t.text('description'),
  start_date: t.date('start_date', { mode: 'string' }),
  end_date: t.date('end_date', { mode: 'string' }),
  progress_status: t.varchar('progress_status', { length: 50 }).$type<MilestoneProgressStatus>().default('planned').notNull(),
  created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: t.timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archived_at: t.timestamp('archived_at', { withTimezone: true }),
  lifecycle_status: t.varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
}));
