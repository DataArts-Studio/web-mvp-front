import { z } from 'zod';

export const TestSuiteDtoSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  name: z.string({ error: 'test error' })
    .min(10, '최소 10자 이상')
    .max(200, '최대 200 이하'),
  description: z.string().optional(),
  project_id: z.uuidv7(),
  sort_order: z.int(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateTestSuiteDtoSchema = TestSuiteDtoSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});

export const CreateTestSuiteSchema = z.object({
  title: z.string({ error: 'test error' })
    .min(10, '최소 10자 이상')
    .max(200, '최대 200 이하'),
  projectId: z.uuidv7(),
  description: z.string().optional(),
  sortOrder: z.int().optional(),
})