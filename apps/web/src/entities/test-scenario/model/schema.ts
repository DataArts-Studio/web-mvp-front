import { z } from 'zod';

export const ScenarioTypeSchema = z.enum(['positive', 'negative', 'edge_case']);
export const ScenarioStatusSchema = z.enum(['DRAFT', 'REVIEW', 'CONFIRMED']);

/** 시나리오 본문 필드(생성·수정 공통). */
const ScenarioFields = {
  name: z.string().min(1, '시나리오 이름을 입력해주세요').max(200),
  description: z.string().max(2000).optional().default(''),
  type: ScenarioTypeSchema.default('positive'),
  relatedRequirementIds: z.array(z.string().max(20)).max(20).optional().default([]),
  status: ScenarioStatusSchema.default('DRAFT'),
};

/** 수동 추가. requirementAnalysisId 는 선택(출처 분석서가 있으면 연결). */
export const CreateScenarioSchema = z.object({
  projectId: z.string().uuid(),
  requirementAnalysisId: z.string().uuid().nullable().optional(),
  ...ScenarioFields,
});

/**
 * 부분 수정. 전달된 필드만 갱신한다.
 * 생성용 필드의 .default() 를 재사용하면 미전달 필드가 빈 값으로 채워져 덮어쓰므로,
 * 여기서는 기본값 없는 optional 로 둬서 undefined 인 필드는 패치 대상에서 빠지게 한다.
 */
export const UpdateScenarioSchema = z.object({
  projectId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1, '시나리오 이름을 입력해주세요').max(200).optional(),
  description: z.string().max(2000).optional(),
  type: ScenarioTypeSchema.optional(),
  relatedRequirementIds: z.array(z.string().max(20)).max(20).optional(),
  status: ScenarioStatusSchema.optional(),
});

/** 드래그 재정렬. 화면 순서대로 id 와 sortOrder 쌍을 전달. */
export const ReorderScenariosSchema = z.object({
  projectId: z.string().uuid(),
  orders: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).max(500),
});

/** AI 가 생성한 시나리오를 한 번에 저장(벌크). 모두 DRAFT 로 들어간다. */
export const SaveGeneratedScenariosSchema = z.object({
  projectId: z.string().uuid(),
  requirementAnalysisId: z.string().uuid().nullable().optional(),
  scenarios: z
    .array(
      z.object({
        name: ScenarioFields.name,
        description: ScenarioFields.description,
        type: ScenarioTypeSchema.default('positive'),
        relatedRequirementIds: ScenarioFields.relatedRequirementIds,
      })
    )
    .min(1)
    .max(50),
});

export type ScenarioType = z.infer<typeof ScenarioTypeSchema>;
export type ScenarioStatus = z.infer<typeof ScenarioStatusSchema>;
export type CreateScenarioInput = z.infer<typeof CreateScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof UpdateScenarioSchema>;
export type ReorderScenariosInput = z.infer<typeof ReorderScenariosSchema>;
export type SaveGeneratedScenariosInput = z.infer<typeof SaveGeneratedScenariosSchema>;
