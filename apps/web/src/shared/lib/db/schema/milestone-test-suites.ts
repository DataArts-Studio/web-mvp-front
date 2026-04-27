import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { milestones } from './milestones';
import { testSuites } from './test-suites';

export const milestoneTestSuites = pgTable('milestone_test_suites', {
    milestone_id: uuid('milestone_id').notNull().references(() => milestones.id, { onDelete: 'cascade' }),
    test_suite_id: uuid('test_suite_id').notNull().references(() => testSuites.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.milestone_id, t.test_suite_id] }),
}));
