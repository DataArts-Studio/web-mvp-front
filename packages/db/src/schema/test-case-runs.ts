import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { testCases } from './test-cases';
import { testRuns } from './test-runs';

export const testCaseRunStatus = ['untested', 'pass', 'fail', 'blocked'] as const;
export type TestCaseRunStatus = (typeof testCaseRunStatus)[number];

export const testCaseRunSourceType = ['suite', 'milestone', 'adhoc'] as const;
export type TestCaseRunSourceType = (typeof testCaseRunSourceType)[number];

/**
 * 결과를 누가/어떻게 기록했는지 출처. 자동매핑(FDD-TR09 V1) 도입과 함께 추가.
 * - manual: 사람이 UI 로 기록
 * - auto: CI 가 자동화 토큰으로 보고
 */
export const testCaseRunResultSource = ['manual', 'auto'] as const;
export type TestCaseRunResultSource = (typeof testCaseRunResultSource)[number];

/**
 * `result_source = 'auto'` 일 때 함께 저장되는 CI 메타.
 * 자유 형식 jsonb 지만 서버에서 Zod 로 검증 후 저장한다.
 */
export interface TestCaseRunAutomationMeta {
  branch?: string;
  sha?: string;
  url?: string;
  durationMs?: number;
  errorMessage?: string;
}

export const testCaseRuns = pgTable(
  'test_case_runs',
  {
    id: uuid('id').primaryKey(),
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
    status: varchar('status').$type<TestCaseRunStatus>().default('untested').notNull(),
    comment: text('comment'),
    executed_at: timestamp('executed_at', { withTimezone: true }),
    source_type: varchar('source_type').$type<TestCaseRunSourceType>().default('adhoc').notNull(),
    source_id: uuid('source_id'),
    excluded_at: timestamp('excluded_at'),
    result_source: varchar('result_source', { length: 20 })
      .$type<TestCaseRunResultSource>()
      .default('manual')
      .notNull(),
    automation_meta: jsonb('automation_meta').$type<TestCaseRunAutomationMeta>(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    resultSourceCheck: check(
      'test_case_runs_result_source_check',
      sql`${t.result_source} in ('manual', 'auto')`
    ),
  })
);
