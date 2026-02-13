import { z } from 'zod';

export const UpdateMilestoneSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, '마일스톤 이름을 입력해주세요.')
    .max(50, '마일스톤 이름은 50자를 초과할 수 없습니다.'),
  description: z.string().max(500, '설명은 500자를 초과할 수 없습니다.').optional(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export type UpdateMilestone = z.infer<typeof UpdateMilestoneSchema>;
