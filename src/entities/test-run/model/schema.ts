import { z } from 'zod';

export const TestRunSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

// Zod schema for creating a new test run
export const CreateTestRunSchema = z.object({
  project_id: z.string().uuid({ message: "유효한 프로젝트 ID를 제공해야 합니다." }),
  name: z.string().min(1, '실행 이름을 입력해주세요.'),
  description: z.string().optional(),
  suite_ids: z.array(z.string().uuid()).optional(),
  milestone_ids: z.array(z.string().uuid()).optional(),
  // created_by can be added here if you have user management
});
