import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

export const project = pgTable('projects', {
  id: uuid('id').primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  identifier: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  owner_name: varchar({ length: 255 }),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
});

// export const projectRelations = relations(project, ({ one }) => {});