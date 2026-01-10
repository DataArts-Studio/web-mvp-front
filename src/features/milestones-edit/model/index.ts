import { z } from 'zod';

const dateSchema = z.preprocess((val) => {
  if (!val || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}, z.date().nullable());

export const UpdateMilestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '마일스톤 이름을 입력해주세요.').max(100),
  description: z.string().optional(),
  startDate: dateSchema,
  endDate: dateSchema,
});

export type UpdateMilestone = z.infer<typeof UpdateMilestoneSchema>;
