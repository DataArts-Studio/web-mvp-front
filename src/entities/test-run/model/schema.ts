import { z } from 'zod';

export const TestRunSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  milestone_id: z.uuidv7().nullable(),
  run_name: z.string().optional(),
  started_at: z.coerce.date().optional(),
  ended_at: z.coerce.date().nullable().optional(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateTestRunSchema = TestRunSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});