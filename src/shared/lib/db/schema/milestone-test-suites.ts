import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

export const milestoneTestSuites = pgTable('milestone_test_suites', {
    milestone_id: uuid('milestone_id').notNull(),
    test_suite_id: uuid('test_suite_id').notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.milestone_id, t.test_suite_id] }),
}));
