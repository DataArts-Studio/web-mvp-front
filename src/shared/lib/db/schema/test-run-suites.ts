import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { testRuns } from './test-runs';
import { testSuites } from './test-suites';

export const testRunSuites = pgTable('test_run_suites', {
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    test_suite_id: uuid('test_suite_id').references(() => testSuites.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.test_run_id, t.test_suite_id] }),
}));
