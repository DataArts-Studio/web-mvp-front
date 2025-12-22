import { z } from 'zod';













export const ProjectDtoSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  identifier: z.string(),
  description: z.string().optional(),
  owner_name: z.string().optional(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date().nullable(),
});

export const CreateProjectDtoSchema = ProjectDtoSchema.omit({
  id: true,
  create_at: true,
  update_at: true,
  delete_at: true,
});

export const ProjectDomainSchema = z.object({
  id: z.uuidv7({ error: 'uuidv7 test error' }),
  projectName: z
    .string({ error: 'test error' })
    .min(1, '프로젝트 이름은 최소 1글자 이상이어야 합니다.')
    .max(50, '프로젝트 이름은 50자를 넘을 수 없습니다.'),
  identifier: z
    .string()
    .min(8, '식별번호는 최소 8자리 이상이어야 합니다.')
    .max(16, '식별번호는 최대 16자리 이하여야 합니다.'),
  description: z.string().optional(),
  ownerName: z.string().optional(),
  createAt: z.date(),
  updateAt: z.date(),
  deleteAt: z.date().nullable(),
});

export const CreateProjectDomainSchema = ProjectDomainSchema.omit({
  id: true,
  createAt: true,
  updateAt: true,
  deleteAt: true,
});

export const ProjectFormSchema = CreateProjectDomainSchema.extend({
  identifierConfirm: z
    .string()
    .min(8, '식별번호는 최소 8자리 이상이어야 합니다.')
    .max(16, '식별번호는 최대 16자리 이하여야 합니다.'),
}).refine((data) => data.identifier === data.identifierConfirm, {
  message: '식별번호가 일치하지 않습니다.',
  path: ['identifierConfirm'],
});
