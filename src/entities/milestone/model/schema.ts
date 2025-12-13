import { z } from 'zod';

export const MilestoneSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  name: z
    .string({ error: 'test error' })
    .min(1, '마일스톤 이름은 최소 1글자 이상이어야 합니다.')
    .max(100, '마일스톤 이름은 100자를 넘을 수 없습니다.'),
  description: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  status: z.string(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateMilestoneSchema = MilestoneSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});