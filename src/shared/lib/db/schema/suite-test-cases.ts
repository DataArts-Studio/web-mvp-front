import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { testCases } from './test-cases';
import { testSuites } from './test-suites';

export const suiteTestCases = pgTable('suite_test_cases', {
    id: uuid('id').primaryKey(),
    suite_id: uuid('suite_id').references(() => testSuites.id, { onDelete: 'cascade' }).notNull(),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }).notNull(),
});
