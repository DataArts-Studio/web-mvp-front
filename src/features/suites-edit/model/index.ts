import { z } from 'zod';

export const UpdateTestSuiteSchema = z.object({
  id: z.string(),
  title: z
    .string({ error: 'test error' })
    .min(5, '최소 5자 이상')
    .max(50, '최대 50 이하'),
  description: z.string().optional(),
});

export type UpdateTestSuite = z.infer<typeof UpdateTestSuiteSchema>;
