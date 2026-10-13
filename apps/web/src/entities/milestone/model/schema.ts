import { isDateRangeOrdered, isValidDateOnly } from '@/shared/lib/date-only';
import { LifecycleStatusEnum } from '@/shared/types';
import { z } from 'zod';

export const MilestoneProgressStatusEnum = z.enum(['planned', 'inProgress', 'done']);

export const MilestoneDtoSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  name: z
    .string({ error: 'test error' })
    .trim()
    .min(1, '마일스톤 이름은 최소 1글자 이상이어야 합니다.')
    .max(50, '마일스톤 이름은 50자를 초과할 수 없습니다.'),
  description: z.string().max(500, '설명은 500자를 초과할 수 없습니다.').optional(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  progress_status: MilestoneProgressStatusEnum.default('planned'),
  created_at: z.date(),
  updated_at: z.date(),
  archived_at: z.date().nullable(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateMilestoneDtoSchema = MilestoneDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
  lifecycle_status: true,
});

export const MILESTONE_DATE_RANGE_ERROR = '종료일은 시작일보다 빠를 수 없습니다.';

/** 마일스톤 날짜는 시간대 변환 없이 'YYYY-MM-DD' 로 주고받는다 (#381). */
export const MilestoneDateSchema = z
  .string()
  .refine(isValidDateOnly, '날짜 형식이 올바르지 않습니다.');

/**
 * 서버에서 날짜 형식과 기간 순서를 확인한다. 클라이언트 검증을 거치지 않은 호출도 막기 위함.
 * 문제가 없으면 null, 있으면 사용자 문구.
 */
export const getMilestoneDateError = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null => {
  if (startDate && !isValidDateOnly(startDate)) return '시작일 형식이 올바르지 않습니다.';
  if (endDate && !isValidDateOnly(endDate)) return '종료일 형식이 올바르지 않습니다.';
  if (!isDateRangeOrdered(startDate, endDate)) return MILESTONE_DATE_RANGE_ERROR;
  return null;
};

export const CreateMilestoneSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '마일스톤 이름을 입력해주세요.')
      .max(50, '마일스톤 이름은 50자를 초과할 수 없습니다.'),
    projectId: z.uuidv7(),
    description: z.string().max(500, '설명은 500자를 초과할 수 없습니다.').optional(),
    startDate: MilestoneDateSchema.nullish(),
    endDate: MilestoneDateSchema.nullish(),
  })
  .refine((data) => isDateRangeOrdered(data.startDate, data.endDate), {
    message: MILESTONE_DATE_RANGE_ERROR,
    path: ['endDate'],
  });
