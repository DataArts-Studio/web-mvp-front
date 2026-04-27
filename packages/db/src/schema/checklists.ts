import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';

export const checklistStatusEnum = ['open', 'in_progress', 'completed'] as const;
export type ChecklistStatus = (typeof checklistStatusEnum)[number];

export const checklists = pgTable('checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<ChecklistStatus>().default('open').notNull(),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archived_at: timestamp('archived_at', { withTimezone: true }),
  lifecycle_status: varchar('lifecycle_status', { length: 20 })
    .$type<LifecycleStatus>().default('ACTIVE').notNull(),
});
