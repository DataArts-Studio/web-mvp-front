import { LifecycleStatusEnum } from '@/shared/types';
import { z } from 'zod';

/** 테스트 실행 이름 최대 길이. 생성·이름 변경·재실행 모두 이 값을 넘지 않는다 (#417). */
export const RUN_NAME_MAX_LENGTH = 100;
export const RUN_NAME_TOO_LONG_MESSAGE = `실행 이름은 ${RUN_NAME_MAX_LENGTH}자를 초과할 수 없습니다.`;

/** 삭제(ARCHIVED)된 실행의 결과·코멘트를 바꾸려 할 때 안내 (#419). */
export const RUN_NOT_ACTIVE_MESSAGE = '삭제된 테스트 실행은 결과를 바꿀 수 없습니다.';

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
  project_id: z.string().uuid({ message: '유효한 프로젝트 ID를 제공해야 합니다.' }),
  name: z
    .string()
    .trim()
    .min(1, '실행 이름을 입력해주세요.')
    .max(RUN_NAME_MAX_LENGTH, RUN_NAME_TOO_LONG_MESSAGE),
  description: z.string().optional(),
  milestone_id: z.string().uuid({ message: '마일스톤을 선택해주세요.' }),
});
