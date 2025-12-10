import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  name: z
    .string({ error: 'test error' })
    .min(1, '프로젝트 이름은 최소 1글자 이상이어야 합니다.')
    .max(50, '프로젝트 이름은 50자를 넘을 수 없습니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자리 이상이어야 합니다.'),
  description: z.string().optional(),
  owner_name: z.string().optional(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});
