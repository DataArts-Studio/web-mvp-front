import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const testSuite = pgTable('test_suites', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  name: varchar('name').notNull(),
  description: varchar('description'),
  sort_order: integer('sort_order'),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
});
