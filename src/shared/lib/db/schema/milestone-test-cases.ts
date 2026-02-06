import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

export const milestoneTestCases = pgTable('milestone_test_cases', {
    milestone_id: uuid('milestone_id').notNull(),
    test_case_id: uuid('test_case_id').notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.milestone_id, t.test_case_id] }),
}));
