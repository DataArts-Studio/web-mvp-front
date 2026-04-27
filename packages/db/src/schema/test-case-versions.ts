import { integer, jsonb, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';

export const testCaseVersions = pgTable('test_case_versions', (t) => ({
  id: t.uuid('id').primaryKey(),
  test_case_id: t.uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }).notNull(),
  version_number: t.integer('version_number').notNull(),
  name: t.varchar('name').notNull(),
  test_type: t.varchar('test_type'),
  tags: t.jsonb('tags').$type<string[]>(),
  pre_condition: t.text('pre_condition'),
  steps: t.text('steps'),
  expected_result: t.text('expected_result'),
  change_summary: t.text('change_summary'),
  change_type: t.varchar('change_type', { length: 20 }).notNull(),
  changed_fields: t.jsonb('changed_fields').$type<string[]>(),
  created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}), (t) => ({
  unqVersion: unique().on(t.test_case_id, t.version_number),
}));
