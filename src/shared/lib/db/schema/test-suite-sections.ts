import { integer, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { testSuites } from './test-suites';

export const testSuiteSections = pgTable('test_suite_sections', {
  id: uuid('id').primaryKey(),
  suite_id: uuid('suite_id').references(() => testSuites.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unqName: unique().on(t.suite_id, t.name),
}));
