import { z } from 'zod';

export const TestCaseSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  test_suite_id: z.uuidv7(),
  case_key: z.string(),
  test_type: z.string(),
  tags: z.array(z.string()).optional(),
  name: z
    .string({ error: 'test error' })
    .min(1, '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.')
    .max(200, '테스트 케이스 이름은 200자를 넘을 수 없습니다.'),
  pre_condition: z.string().optional(),
  steps: z.string().optional(),
  expected_result: z.string().optional(),
  estimate_minutes: z.int().optional(),
  sort_order: z.int().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const CreateTestCaseSchema = TestCaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});