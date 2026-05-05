import { z } from 'zod';

export const CreateSectionSchema = z.object({
  suiteId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, '섹션 이름을 입력해주세요.')
    .max(100, '섹션 이름은 100자를 초과할 수 없습니다.')
    .refine((v) => v.trim().length > 0, '유효한 이름을 입력해주세요.'),
});

export const UpdateSectionSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, '섹션 이름을 입력해주세요.')
    .max(100, '섹션 이름은 100자를 초과할 수 없습니다.')
    .refine((v) => v.trim().length > 0, '유효한 이름을 입력해주세요.')
    .optional(),
  sortOrder: z.number().int().optional(),
});

export const ReorderSectionsSchema = z.object({
  suiteId: z.string().uuid(),
  sectionIds: z.array(z.string().uuid()).min(1),
});
