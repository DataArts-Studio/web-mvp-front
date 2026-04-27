import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';

export const linkTypeEnum = ['github_pr', 'github_issue'] as const;
export type ExternalLinkType = (typeof linkTypeEnum)[number];

export const testCaseExternalLinks = pgTable('test_case_external_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  test_case_id: uuid('test_case_id')
    .notNull()
    .references(() => testCases.id, { onDelete: 'cascade' }),
  link_type: varchar('link_type', { length: 20 }).$type<ExternalLinkType>().notNull(),
  external_url: text('external_url').notNull(),
  external_id: varchar('external_id', { length: 50 }).notNull(),
  repo_full_name: varchar('repo_full_name', { length: 255 }).notNull(),
  title: text('title'),
  status: varchar('status', { length: 20 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  caseIdx: index('idx_tc_ext_links_case').on(t.test_case_id),
  externalIdx: index('idx_tc_ext_links_external').on(t.repo_full_name, t.external_id),
}));
