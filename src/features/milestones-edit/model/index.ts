import { z } from 'zod';

export const UpdateMilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '마일스톤 이름을 입력해주세요.').max(100),
  description: z.string().optional(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
});

export type UpdateMilestone = z.infer<typeof UpdateMilestoneSchema>;
