import { z } from 'zod';

export const LifecycleStatusEnum = z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']);










export const ProjectDtoSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  identifier: z.string(),
  description: z.string().nullable(),
  owner_name: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  archived_at: z.date().nullable(),
  lifecycle_status: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateProjectDtoSchema = ProjectDtoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
  lifecycle_status: true,
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
  createdAt: z.date(),
  updatedAt: z.date(),
  archivedAt: z.date().nullable(),
  lifecycleStatus: LifecycleStatusEnum.default('ACTIVE'),
});

export const CreateProjectDomainSchema = ProjectDomainSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  lifecycleStatus: true,
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
