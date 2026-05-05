import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { milestones } from './milestones';
import { testRuns } from './test-runs';

export const testRunMilestones = pgTable(
  'test_run_milestones',
  {
    test_run_id: uuid('test_run_id')
      .notNull()
      .references(() => testRuns.id, { onDelete: 'cascade' }),
    milestone_id: uuid('milestone_id')
      .notNull()
      .references(() => milestones.id, { onDelete: 'restrict' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.test_run_id, t.milestone_id] }),
  })
);
