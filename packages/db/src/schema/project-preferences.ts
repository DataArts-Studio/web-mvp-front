import { jsonb, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectPreferences = pgTable('project_preferences', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [unique().on(t.project_id, t.key)]);
