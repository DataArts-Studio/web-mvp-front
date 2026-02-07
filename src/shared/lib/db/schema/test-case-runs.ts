import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';
import { testRuns } from './test-runs';

export const testCaseRunStatus = ['untested', 'pass', 'fail', 'blocked'] as const;
export type TestCaseRunStatus = (typeof testCaseRunStatus)[number];

export const testCaseRunSourceType = ['suite', 'milestone', 'adhoc'] as const;
export type TestCaseRunSourceType = (typeof testCaseRunSourceType)[number];

export const testCaseRuns = pgTable('test_case_runs', {
    id: uuid('id').primaryKey(),
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
    status: varchar('status').$type<TestCaseRunStatus>().default('untested').notNull(),
    comment: text('comment'),
    executed_at: timestamp('executed_at'),
    source_type: varchar('source_type').$type<TestCaseRunSourceType>().default('adhoc').notNull(),
    source_id: uuid('source_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});
