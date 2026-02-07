import { z } from 'zod';
import { LifecycleStatusEnum } from '../../project/model/schema';
export const TestCaseResultStatusEnum = z.enum(['untested', 'pass', 'fail', 'blocked']);

export const TestCaseDtoSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  test_suite_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.').max(200, '테스트 케이스 이름은 200자를 넘을 수 없습니다.'),
  display_id: z.number().int(),
  case_key: z.string().optional(),
  test_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pre_condition: z.string().optional(),
  steps: z.string().optional(),
  expected_result: z.string().optional(),
  sort_order: z.number().int().optional(),
  result_status: TestCaseResultStatusEnum.default('untested'),
  created_at: z.date(),
  updated_at: z.date(),
  archived_at: z.date().nullable(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateTestCaseDtoSchema = TestCaseDtoSchema.omit({
  id: true,
  display_id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
  lifecycle_status: true,
  result_status: true,
});