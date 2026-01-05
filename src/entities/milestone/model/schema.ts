import { z } from 'zod';







export const MilestoneDtoSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  project_id: z.uuidv7(),
  name: z
    .string({ error: 'test error' })
    .min(1, '마일스톤 이름은 최소 1글자 이상이어야 합니다.')
    .max(100, '마일스톤 이름은 100자를 넘을 수 없습니다.'),
  description: z.string().optional(),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  status: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const CreateMilestoneDtoSchema = MilestoneDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const CreateMilestoneSchema = z.object({
  title: z.string().min(1, '마일스톤 이름을 입력해주세요.').max(100),
  projectId: z.uuidv7(),
  description: z.string().optional(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
});

export const UpdateMilestoneSchema = CreateMilestoneSchema.extend({
  status: z.string().optional(),
})