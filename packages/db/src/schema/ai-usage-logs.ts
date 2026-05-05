import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  action_type: varchar('action_type', { length: 30 }).notNull(), // 'generate_cases'
  input_tokens: integer('input_tokens').default(0).notNull(),
  output_tokens: integer('output_tokens').default(0).notNull(),
  generated_count: integer('generated_count').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
