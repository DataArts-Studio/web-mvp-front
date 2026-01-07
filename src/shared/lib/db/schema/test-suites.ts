import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const testSuites = pgTable('test_suites', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id),
  name: varchar('name').notNull(),
  description: varchar('description'),
  sort_order: integer('sort_order'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});
