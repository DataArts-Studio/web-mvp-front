import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';
import { testSuites } from './test-suites';

export const suiteTestCases = pgTable('suite_test_cases', {
    suite_id: uuid('suite_id').references(() => testSuites.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.suite_id, t.test_case_id] }),
}));
