import { integer, pgTable, text, unique, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';

export const templateCategoryEnum = ['BUILTIN', 'CUSTOM'] as const;
export type TemplateCategory = (typeof templateCategoryEnum)[number];

export const testCaseTemplates = pgTable('test_case_templates', (t) => ({
  id: t.uuid('id').primaryKey(),
  project_id: t.uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: t.varchar('name', { length: 50 }).notNull(),
  description: t.varchar('description', { length: 200 }),
  category: t.varchar('category', { length: 20 }).$type<TemplateCategory>().default('CUSTOM').notNull(),
  test_type: t.varchar('test_type'),
  default_tags: t.text('default_tags'), // JSON stringified array
  pre_condition: t.text('pre_condition'),
  test_steps: t.text('test_steps'),
  expected_result: t.text('expected_result'),
  usage_count: t.integer('usage_count').default(0).notNull(),
  sort_order: t.integer('sort_order').default(0),
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t.timestamp('updated_at').defaultNow().notNull(),
  lifecycle_status: t.varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
}), (t) => ({
  unq: unique().on(t.project_id, t.name),
}));
