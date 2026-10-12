import { sql } from 'drizzle-orm';
import { integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { testSuites } from './test-suites';

export const testSuiteSections = pgTable(
  'test_suite_sections',
  {
    id: uuid('id').primaryKey(),
    suite_id: uuid('suite_id')
      .references(() => testSuites.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    archived_at: timestamp('archived_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    // 삭제(archived_at)된 섹션 이름은 다시 쓸 수 있게 활성 섹션끼리만 이름이 겹치지 않게 한다 (#410).
    unqActiveName: uniqueIndex('test_suite_sections_suite_id_name_active_unq')
      .on(t.suite_id, t.name)
      .where(sql`${t.archived_at} IS NULL`),
  })
);
