import { z } from 'zod';

export const UpdateTestCaseSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.')
    .max(200, '테스트 케이스 이름은 200자를 넘을 수 없습니다.'),
  testSuiteId: z.string().uuid().nullable().optional(),
  testType: z.string().optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  preCondition: z.string().optional(),
  testSteps: z.string().optional(),
  expectedResult: z.string().optional(),
});

export type UpdateTestCase = z.infer<typeof UpdateTestCaseSchema>;
