import { z } from 'zod';

export const TestCaseDtoSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1, '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.').max(200, '테스트 케이스 이름은 200자를 넘을 수 없습니다.'),
  case_key: z.string().optional(),
  test_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pre_condition: z.string().optional(),
  steps: z.string().optional(),
  expected_result: z.string().optional(),
  sort_order: z.number().int().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const CreateTestCaseDtoSchema = TestCaseDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});