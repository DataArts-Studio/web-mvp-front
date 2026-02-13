import { z } from 'zod';
import { LifecycleStatusEnum } from '../../project/model/schema';

export const TestRunStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

export const TestRunSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: TestRunStatusEnum.default('NOT_STARTED'),
  created_at: z.date(),
  updated_at: z.date(),
  archived_at: z.date().nullable(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

// Zod schema for creating a new test run
export const CreateTestRunSchema = z.object({
  project_id: z.string().uuid({ message: "유효한 프로젝트 ID를 제공해야 합니다." }),
  name: z.string().min(1, '실행 이름을 입력해주세요.'),
  description: z.string().optional(),
  milestone_id: z.string().uuid({ message: '마일스톤을 선택해주세요.' }),
});