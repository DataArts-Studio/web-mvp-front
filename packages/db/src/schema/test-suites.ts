import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { aiRequirementAnalyses } from './ai-requirement-analyses';
import { LifecycleStatus, projects } from './projects';

export const testSuites = pgTable('test_suites', {
  id: uuid('id').primaryKey(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: varchar('description'),
  /** AI 요구사항 분석에서 시나리오로 생성된 스위트의 출처. 일반 스위트는 NULL. */
  requirement_analysis_id: uuid('requirement_analysis_id').references(
    () => aiRequirementAnalyses.id,
    { onDelete: 'set null' }
  ),
  sort_order: integer('sort_order'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archived_at: timestamp('archived_at', { withTimezone: true }),
  lifecycle_status: varchar('lifecycle_status', { length: 20 })
    .$type<LifecycleStatus>()
    .default('ACTIVE')
    .notNull(),
});
