import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { milestones } from './milestones';
import { testCases } from './test-cases';

export const milestoneTestCases = pgTable('milestone_test_cases', {
    milestone_id: uuid('milestone_id').references(() => milestones.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id').references(() => testCases.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.milestone_id, t.test_case_id] }),
}));
