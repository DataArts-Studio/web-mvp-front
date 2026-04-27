import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const githubConnections = pgTable('github_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: 'cascade' }),
  repo_full_name: varchar('repo_full_name', { length: 255 }),
  access_token: text('access_token').notNull(),
  webhook_id: varchar('webhook_id', { length: 50 }),
  webhook_secret: text('webhook_secret'),
  connected_at: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
