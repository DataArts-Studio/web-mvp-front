import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

export const project = pgTable('project', {
  id: uuid('id').primaryKey(),
  name: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  owner_name: varchar({ length: 255 }),
  create_at: timestamp(),
  update_at: timestamp(),
  delete_at: timestamp(),
});


// export const projectRelations = relations(project, ({ one }) => {});
