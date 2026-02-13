import { z } from 'zod';

export const TestRunMilestoneSchema = z.object({
  test_run_id: z.string().uuid(),
  milestone_id: z.string().uuid(),
});
