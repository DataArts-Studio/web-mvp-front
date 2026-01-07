// src/shared/lib/db/schema/suite-test-cases.ts
import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';
import { testSuite } from './test-suites';

export const suiteTestCases = pgTable('suite_test_cases', {
    suite_id: uuid('suite_id').references(() => testSuite.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.suite_id, t.test_case_id] }),
}));

export const suiteTestCasesRelations = relations(suiteTestCases, ({ one }) => ({
    testSuite: one(testSuite, {
        fields: [suiteTestCases.suite_id],
        references: [testSuite.id],
    }),
    testCase: one(testCases, {
        fields: [suiteTestCases.test_case_id],
        references: [testCases.id],
    }),
}));
