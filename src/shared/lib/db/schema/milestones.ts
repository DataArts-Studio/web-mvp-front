import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const milestones = pgTable('milestones', (t) => ({
  id: t.uuid('id').primaryKey(),
  project_id: t.uuid('project_id').references(() => projects.id),
  name: t.varchar('name', { length: 255 }).notNull(),
  description: t.text('description'),
  start_date: t.timestamp('start_date'),
  end_date: t.timestamp('end_date'),
  status: t.varchar('status', { length: 50 }).default('planned').notNull(),
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t.timestamp('updated_at').defaultNow().notNull(),
  deleted_at: t.timestamp('deleted_at'),
}));
