import { z } from 'zod';

export const SaveAiConfigSchema = z.object({
  projectId: z.string().uuid(),
  provider: z.enum(['openai', 'anthropic']),
  apiKey: z.string().min(1, 'API 키를 입력해주세요'),
  model: z.string().optional(),
});

export const GenerateCasesSchema = z.object({
  projectId: z.string().uuid(),
  description: z
    .string()
    .min(20, '더 구체적인 설명을 입력해주세요 (최소 20자)')
    .max(3000, '설명은 3,000자를 초과할 수 없습니다'),
  language: z.enum(['ko', 'en']).default('ko'),
});

export const GeneratedTestCaseSchema = z.object({
  name: z.string().min(1).max(200),
  preCondition: z.string().max(1000).optional().default(''),
  steps: z.string().max(2000).optional().default(''),
  expectedResult: z.string().max(1000).optional().default(''),
  tags: z.array(z.string()).max(5).optional().default([]),
  category: z.enum(['positive', 'negative', 'edge_case']).optional().default('positive'),
});

export const SaveGeneratedCasesSchema = z.object({
  projectId: z.string().uuid(),
  suiteId: z.string().uuid().optional(),
  cases: z.array(GeneratedTestCaseSchema).min(1).max(20),
});
