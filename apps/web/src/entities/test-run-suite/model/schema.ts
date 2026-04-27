import { z } from 'zod';

export const TestRunSuiteSchema = z.object({
  test_run_id: z.string().uuid(),
  test_suite_id: z.string().uuid(),
});
