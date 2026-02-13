/**
 * 프로젝트 접근 관련 Zod 스키마
 */

import { z } from 'zod';

/**
 * 프로젝트 접근 비밀번호 검증 스키마
 */
export const ProjectAccessFormSchema = z.object({
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(8, '비밀번호는 최소 8자리 이상이어야 합니다.')
    .max(16, '비밀번호는 최대 16자리 이하여야 합니다.'),
});

/**
 * 프로젝트 접근 요청 스키마
 */
export const VerifyProjectAccessRequestSchema = z.object({
  projectName: z.string().min(1, '프로젝트 이름이 필요합니다.'),
  password: ProjectAccessFormSchema.shape.password,
});

export type ProjectAccessFormInput = z.infer<typeof ProjectAccessFormSchema>;
export type VerifyProjectAccessInput = z.infer<typeof VerifyProjectAccessRequestSchema>;
