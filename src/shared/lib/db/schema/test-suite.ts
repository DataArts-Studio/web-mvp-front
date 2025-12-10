import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { project } from './project';

export const suite = pgTable('test_suite', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => project.id),
  name: varchar('name').notNull(),
  sort_order: varchar('sort_order'),
  create_at: timestamp().defaultNow().notNull(),
  update_at: timestamp().defaultNow().notNull(),
  delete_at: timestamp(),
});
