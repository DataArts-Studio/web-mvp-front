import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { milestones } from './milestones';
import { testRuns } from './test-runs';

export const testRunMilestones = pgTable('test_run_milestones', {
    test_run_id: uuid('test_run_id').references(() => testRuns.id, { onDelete: 'cascade' }),
    milestone_id: uuid('milestone_id').references(() => milestones.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.test_run_id, t.milestone_id] }),
}));

export const testRunMilestonesRelations = relations(testRunMilestones, ({ one }) => ({
    testRun: one(testRuns, {
        fields: [testRunMilestones.test_run_id],
        references: [testRuns.id],
    }),
    milestone: one(milestones, {
        fields: [testRunMilestones.milestone_id],
        references: [milestones.id],
    }),
}));
