import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { milestones } from './milestones';
import { testRun } from './test-run';

export const testRunMilestones = pgTable(
  'test_run_milestones',
  {
    testRunId: uuid('test_run_id')
      .notNull()
      .references(() => testRun.id, { onDelete: 'cascade' }),

    milestoneId: uuid('milestone_id')
      .notNull()
      .references(() => milestones.id, { onDelete: 'restrict' }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.testRunId, table.milestoneId],
    }),
  })
);
