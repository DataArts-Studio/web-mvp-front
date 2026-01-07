import { z } from 'zod';

export const TestRunStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
export const TestRunSourceTypeEnum = z.enum(['SUITE', 'MILESTONE', 'ADHOC']);

export const TestRunSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  milestone_id: z.string().uuid().nullable(),
  run_name: z.string(),
  status: TestRunStatusEnum.default('NOT_STARTED'),
  source_type: TestRunSourceTypeEnum,
  started_at: z.coerce.date().optional(),
  ended_at: z.coerce.date().nullable().optional(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

// 서버 액션용 입력 스키마 (클라이언트에서 받는 데이터)
export const CreateTestRunInputSchema = z.object({
  project_id: z.string().uuid(),
  run_name: z.string().min(1, '실행 이름을 입력해주세요.'),
  source_type: TestRunSourceTypeEnum,
  milestone_id: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const CreateTestRunSchema = TestRunSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});