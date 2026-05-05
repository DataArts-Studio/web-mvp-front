import { pgTable } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { testCases } from './test-cases';

export const testCaseAttachments = pgTable('test_case_attachments', (t) => ({
  id: t.uuid('id').primaryKey(),
  test_case_id: t.uuid('test_case_id').notNull().references(() => testCases.id, { onDelete: 'cascade' }),
  project_id: t.uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  file_name: t.varchar('file_name', { length: 500 }).notNull(),
  file_size: t.integer('file_size').notNull(),
  file_type: t.varchar('file_type', { length: 100 }),
  storage_path: t.text('storage_path').notNull(),
  archived_at: t.timestamp('archived_at'),
  created_at: t.timestamp('created_at').defaultNow().notNull(),
}));
