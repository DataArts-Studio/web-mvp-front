import { GeneratedScenarioSchema } from '@/entities/requirement-analysis';
import { z } from 'zod';

/** 시나리오 AI 생성 요청 (JSON). */
export const GenerateScenariosSchema = z.object({
  projectId: z.string().uuid(),
  description: z
    .string()
    .min(20, '더 구체적인 요구사항을 입력해주세요 (최소 20자)')
    .max(5000, '요구사항은 5,000자를 초과할 수 없습니다'),
  language: z.enum(['ko', 'en']).default('ko'),
});

/** LLM 응답 계약 (시나리오 배열만). */
export const GenerateScenariosResultSchema = z.object({
  scenarios: z.array(GeneratedScenarioSchema).min(1).max(20),
});

export type GenerateScenariosInput = z.infer<typeof GenerateScenariosSchema>;
export type GenerateScenariosResult = z.infer<typeof GenerateScenariosResultSchema>;
