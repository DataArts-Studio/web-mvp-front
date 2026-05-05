import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects, LifecycleStatus } from './projects';

export const aiProviderEnum = ['openai', 'anthropic', 'gemini'] as const;
export type AiProvider = (typeof aiProviderEnum)[number];

export const projectAiConfigs = pgTable('project_ai_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).$type<AiProvider>().notNull(),
  api_key: text('api_key').notNull(), // AES-256-GCM encrypted
  model: varchar('model', { length: 50 }),
  lifecycle_status: varchar('lifecycle_status', { length: 20 }).$type<LifecycleStatus>().default('ACTIVE').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
