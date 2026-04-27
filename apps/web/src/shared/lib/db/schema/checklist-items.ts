import { boolean, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { checklists } from './checklists';

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  checklist_id: uuid('checklist_id')
    .notNull()
    .references(() => checklists.id, { onDelete: 'cascade' }),
  content: varchar('content', { length: 500 }).notNull(),
  is_checked: boolean('is_checked').notNull().default(false),
  sort_order: integer('sort_order').notNull().default(0),
  checked_at: timestamp('checked_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
