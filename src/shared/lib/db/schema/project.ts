import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

export const project = pgTable('project', {
  id: uuid('id').primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  owner_name: varchar({ length: 255 }).notNull(),
  create_at: timestamp().defaultNow().notNull(),
  update_at: timestamp().defaultNow().notNull(),
  delete_at: timestamp(),
});

// export const projectRelations = relations(project, ({ one }) => {});