import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { LifecycleStatus, projects } from './projects';
import { testSuiteSections } from './test-suite-sections';
import { testSuites } from './test-suites';

export const testCaseResultStatusEnum = ['untested', 'pass', 'fail', 'blocked'] as const;
export type TestCaseResultStatus = (typeof testCaseResultStatusEnum)[number];

/**
 * 자동화 상태 (FDD-TR13 자동화 후보 식별 엔진).
 * - manual: 수동 케이스 (기본값)
 * - candidate: 자동화 후보로 마킹됨
 * - automated: 자동화 완료 (후보 추천 대상에서 제외)
 */
export const automationStatusEnum = ['manual', 'candidate', 'automated'] as const;
export type AutomationStatus = (typeof automationStatusEnum)[number];

export const testCases = pgTable(
  'test_cases',
  (t) => ({
    id: t.uuid('id').primaryKey(),
    project_id: t.uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    test_suite_id: t
      .uuid('test_suite_id')
      .references(() => testSuites.id, { onDelete: 'set null' }),
    section_id: t
      .uuid('section_id')
      .references(() => testSuiteSections.id, { onDelete: 'set null' }),
    name: t.text('name').notNull(),
    steps: t.text('steps'),
    test_type: t.varchar('test_type'),
    display_id: t.integer('display_id'),
    case_key: t.varchar('case_key'),
    pre_condition: t.text('pre_condition'),
    tags: t.text('tags').array(10),
    expected_result: t.text('expected_result'),
    sort_order: t.integer('sort_order'),
    result_status: t
      .varchar('result_status', { length: 20 })
      .$type<TestCaseResultStatus>()
      .default('untested')
      .notNull(),
    automation_status: t
      .varchar('automation_status', { length: 20 })
      .$type<AutomationStatus>()
      .default('manual')
      .notNull(),
    created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: t.timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    archived_at: t.timestamp('archived_at', { withTimezone: true }),
    lifecycle_status: t
      .varchar('lifecycle_status', { length: 20 })
      .$type<LifecycleStatus>()
      .default('ACTIVE')
      .notNull(),
  }),
  (t) => ({
    unq: unique().on(t.project_id, t.name),
    unqDisplayId: unique().on(t.project_id, t.display_id),
    automationStatusCheck: check(
      'test_cases_automation_status_check',
      sql`${t.automation_status} in ('manual', 'candidate', 'automated')`
    ),
  })
);
