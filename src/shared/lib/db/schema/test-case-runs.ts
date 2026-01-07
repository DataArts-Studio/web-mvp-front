import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';
import { testRuns } from './test-runs';

export const testCaseRunStatus = ['untested', 'pass', 'fail', 'blocked'] as const;
export type TestCaseRunStatus = (typeof testCaseRunStatus)[number];

export const testCaseRuns = pgTable('test_case_runs', {
    id: uuid('id').primaryKey(),
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
    status: varchar('status').$type<TestCaseRunStatus>().default('untested').notNull(),
    comment: text('comment'),
    executed_at: timestamp('executed_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const testCaseRunRelations = relations(testCaseRuns, ({ one }) => ({
    testRun: one(testRuns, {
        fields: [testCaseRuns.test_run_id],
        references: [testRuns.id],
    }),
    testCase: one(testCases, {
        fields: [testCaseRuns.test_case_id],
        references: [testCases.id],
    }),
}));
