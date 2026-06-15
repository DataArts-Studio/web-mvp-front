import { z } from 'zod';

/**
 * 인증 시크릿 입력 검증. 모든 필드 optional. 빈 객체는 "인증 없음"으로 취급한다.
 * 헤더/쿠키 키·값 길이는 합리적 상한으로 제한해 비정상 payload 를 막는다.
 */
export const TargetSiteAuthSecretSchema = z.object({
  username: z.string().max(500).optional(),
  password: z.string().max(2000).optional(),
  headers: z.record(z.string().max(200), z.string().max(4000)).optional(),
  cookies: z.record(z.string().max(200), z.string().max(4000)).optional(),
});

const baseUrlSchema = z
  .string()
  .trim()
  .url('올바른 URL 형식이 아닙니다.')
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v), {
    message: 'http 또는 https 로 시작하는 주소를 입력해주세요.',
  });

export const CreateTargetSiteSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1, '대상 이름을 입력해주세요.').max(200),
  baseUrl: baseUrlSchema,
  /** 미지정이면 인증 없음으로 저장. */
  auth: TargetSiteAuthSecretSchema.optional(),
});

export const UpdateTargetSiteSchema = z.object({
  projectId: z.string().uuid(),
  targetSiteId: z.string().uuid(),
  name: z.string().trim().min(1, '대상 이름을 입력해주세요.').max(200).optional(),
  baseUrl: baseUrlSchema.optional(),
  /**
   * 인증 갱신 의도 표현:
   * - 필드 누락(undefined): 기존 시크릿 유지.
   * - null: 기존 시크릿 제거.
   * - 객체: 해당 값으로 교체.
   */
  auth: TargetSiteAuthSecretSchema.nullish(),
});

export const DeleteTargetSiteSchema = z.object({
  projectId: z.string().uuid(),
  targetSiteId: z.string().uuid(),
});

export type CreateTargetSiteInput = z.infer<typeof CreateTargetSiteSchema>;
export type UpdateTargetSiteInput = z.infer<typeof UpdateTargetSiteSchema>;
export type DeleteTargetSiteInput = z.infer<typeof DeleteTargetSiteSchema>;
