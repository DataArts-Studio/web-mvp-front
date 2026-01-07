import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { testRuns } from './test-runs';
import { testSuite } from './test-suites';

export const testRunSuites = pgTable('test_run_suites', {
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    test_suite_id: uuid('test_suite_id').references(() => testSuite.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.test_run_id, t.test_suite_id] }),
}));

export const testRunSuitesRelations = relations(testRunSuites, ({ one }) => ({
    testRun: one(testRuns, {
        fields: [testRunSuites.test_run_id],
        references: [testRuns.id],
    }),
    testSuite: one(testSuite, {
        fields: [testRunSuites.test_suite_id],
        references: [testSuite.id],
    }),
}));
