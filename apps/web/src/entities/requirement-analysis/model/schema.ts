import { z } from 'zod';

// --- AI 출력 계약 (분석서 + 시나리오) ---

export const FunctionalRequirementSchema = z.object({
  id: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
});

export const NonFunctionalRequirementSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional().default(''),
});

export const GeneratedScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  type: z.enum(['positive', 'negative', 'edge_case']).optional().default('positive'),
  relatedRequirementIds: z.array(z.string().max(20)).max(20).optional().default([]),
});

export const RequirementAnalysisSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(3000).optional().default(''),
  functionalRequirements: z.array(FunctionalRequirementSchema).max(50).optional().default([]),
  nonFunctionalRequirements: z.array(NonFunctionalRequirementSchema).max(50).optional().default([]),
  constraints: z.array(z.string().max(500)).max(50).optional().default([]),
  assumptions: z.array(z.string().max(500)).max(50).optional().default([]),
  openQuestions: z.array(z.string().max(500)).max(50).optional().default([]),
});

/** LLM 응답 전체 계약. 라우트에서 이 스키마로 검증한다. */
export const RequirementAnalysisResultSchema = z.object({
  analysis: RequirementAnalysisSchema,
  scenarios: z.array(GeneratedScenarioSchema).min(1).max(30),
});

// --- 요청 스키마 (JSON / multipart). ai-config 의 generate 쌍을 미러. ---

export const AnalyzeRequirementsSchema = z.object({
  projectId: z.string().uuid(),
  description: z
    .string()
    .min(20, '더 구체적인 요구사항을 입력해주세요 (최소 20자)')
    .max(5000, '요구사항은 5,000자를 초과할 수 없습니다'),
  language: z.enum(['ko', 'en']).default('ko'),
});

export const AnalyzeRequirementsMultipartSchema = z.object({
  projectId: z.string().uuid(),
  description: z
    .string()
    .max(5000, '요구사항은 5,000자를 초과할 수 없습니다')
    .optional()
    .default(''),
  language: z.enum(['ko', 'en']).default('ko'),
});

// --- 저장 액션 입력 ---

export const SaveRequirementAnalysisSchema = z.object({
  projectId: z.string().uuid(),
  sourceInput: z.string().min(1).max(5000),
  language: z.enum(['ko', 'en']).default('ko'),
  analysis: RequirementAnalysisSchema,
  scenarios: z.array(GeneratedScenarioSchema).min(1).max(30),
  /** 시나리오 중 스위트로 저장할 인덱스. 미지정 시 전부 저장. */
  selectedScenarioIndices: z.array(z.number().int().min(0)).optional(),
  attachment: z
    .object({
      type: z.enum(['pdf', 'markdown']),
      charCount: z.number().int().min(0),
    })
    .nullable()
    .optional(),
});

export type RequirementAnalysis = z.infer<typeof RequirementAnalysisSchema>;
export type GeneratedScenario = z.infer<typeof GeneratedScenarioSchema>;
export type RequirementAnalysisResult = z.infer<typeof RequirementAnalysisResultSchema>;
