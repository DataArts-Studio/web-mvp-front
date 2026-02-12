import { z } from 'zod';
import { LifecycleStatusEnum } from '../../project/model/schema';

export const TestSuiteDtoSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  name: z.string({ error: 'test error' })
    .min(10, '최소 10자 이상')
    .max(200, '최대 200 이하'),
  description: z.string().optional(),
  project_id: z.uuidv7(),
  sort_order: z.int(),
  created_at: z.date(),
  updated_at: z.date(),
  archived_at: z.date().nullable(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateTestSuiteDtoSchema = TestSuiteDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
  lifecycle_status: true,
});

export const CreateTestSuiteSchema = z.object({
  title: z.string({ error: 'test error' })
    .min(10, '최소 10자 이상')
    .max(200, '최대 200 이하'),
  projectId: z.uuidv7(),
  description: z.string().optional(),
  sortOrder: z.int().optional(),
})