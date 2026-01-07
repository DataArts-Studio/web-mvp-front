import { z } from 'zod';

export const TestCaseRunStatusEnum = z.enum(['untested', 'pass', 'fail', 'blocked']);

export const TestCaseRunSchema = z.object({
  id: z.string().uuid(),
  test_run_id: z.string().uuid(),
  test_case_id: z.string().uuid(),
  status: TestCaseRunStatusEnum.default('untested'),
  comment: z.string().nullable(),
  executed_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateTestCaseRunSchema = TestCaseRunSchema.pick({
    test_run_id: true,
    test_case_id: true,
}).merge(TestCaseRunSchema.partial().pick({
    status: true,
    comment: true,
    executed_at: true,
}));
