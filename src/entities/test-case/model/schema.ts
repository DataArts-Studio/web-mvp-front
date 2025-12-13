import { z } from 'zod';

export const TestCaseSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  test_suite_id: z.uuidv7(),
  name: z
    .string({ error: 'test error' })
    .min(1, '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.')
    .max(200, '테스트 케이스 이름은 200자를 넘을 수 없습니다.'),
  steps: z.string().optional(),
  expected_result: z.string().optional(),
  sort_order: z.int().optional(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateTestCaseSchema = TestCaseSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});