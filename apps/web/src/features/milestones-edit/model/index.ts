import { MILESTONE_DATE_RANGE_ERROR } from '@/entities/milestone';
import { isDateRangeOrdered, isValidDateOnly } from '@/shared/lib/date-only';
import { z } from 'zod';

// 날짜 입력(type="date")은 비우면 '' 를 준다. 'YYYY-MM-DD' 또는 빈 값만 받는다 (#381).
const DateInputSchema = z
  .string()
  .nullable()
  .refine((value) => !value || isValidDateOnly(value), '날짜 형식이 올바르지 않습니다.');

export const UpdateMilestoneSchema = z
  .object({
    id: z.string(),
    title: z
      .string()
      .trim()
      .min(1, '마일스톤 이름을 입력해주세요.')
      .max(50, '마일스톤 이름은 50자를 초과할 수 없습니다.'),
    description: z.string().max(500, '설명은 500자를 초과할 수 없습니다.').optional(),
    startDate: DateInputSchema,
    endDate: DateInputSchema,
  })
  .refine((data) => isDateRangeOrdered(data.startDate, data.endDate), {
    message: MILESTONE_DATE_RANGE_ERROR,
    path: ['endDate'],
  });

export type UpdateMilestone = z.infer<typeof UpdateMilestoneSchema>;
