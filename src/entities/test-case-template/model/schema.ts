import { z } from 'zod';
import { LifecycleStatusEnum } from '@/shared/types';

export const TemplateCategoryEnum = z.enum(['BUILTIN', 'CUSTOM']);

export const TestCaseTemplateDtoSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  name: z.string().min(1, '템플릿 이름은 최소 1글자 이상이어야 합니다.').max(50, '템플릿 이름은 50자를 넘을 수 없습니다.'),
  description: z.string().max(200, '설명은 200자를 넘을 수 없습니다.').nullable().optional(),
  category: TemplateCategoryEnum.default('CUSTOM'),
  test_type: z.string().optional(),
  default_tags: z.string().nullable().optional(), // JSON stringified array
  pre_condition: z.string().optional(),
  test_steps: z.string().optional(),
  expected_result: z.string().optional(),
  usage_count: z.int().default(0),
  sort_order: z.int().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateTestCaseTemplateDtoSchema = TestCaseTemplateDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  lifecycle_status: true,
  usage_count: true,
  category: true,
});
