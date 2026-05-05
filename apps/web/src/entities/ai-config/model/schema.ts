import { z } from 'zod';

const API_KEY_RULES = {
  gemini: {
    prefix: 'AIza',
    minLength: 39,
    maxLength: 39,
    prefixError: '올바른 Gemini API 키가 아닙니다. "AIza"로 시작하는 키를 입력해주세요.',
    lengthError: '올바른 Gemini API 키 형식이 아닙니다. 키를 다시 확인해주세요.',
  },
  openai: {
    prefix: 'sk-',
    minLength: 40,
    maxLength: 200,
    prefixError: '올바른 OpenAI API 키가 아닙니다. "sk-"로 시작하는 키를 입력해주세요.',
    lengthError: '올바른 OpenAI API 키 형식이 아닙니다. 키를 다시 확인해주세요.',
  },
  anthropic: {
    prefix: 'sk-ant-',
    minLength: 40,
    maxLength: 200,
    prefixError: '올바른 Anthropic API 키가 아닙니다. "sk-ant-"로 시작하는 키를 입력해주세요.',
    lengthError: '올바른 Anthropic API 키 형식이 아닙니다. 키를 다시 확인해주세요.',
  },
} as const;

export { API_KEY_RULES };

export const SaveAiConfigSchema = z
  .object({
    projectId: z.string().uuid(),
    provider: z.enum(['openai', 'anthropic', 'gemini']),
    apiKey: z.string().min(1, 'API 키를 입력해주세요'),
    model: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const rule = API_KEY_RULES[data.provider];
    const key = data.apiKey.trim();

    if (!key.startsWith(rule.prefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: rule.prefixError,
        path: ['apiKey'],
      });
      return;
    }

    if (key.length < rule.minLength || key.length > rule.maxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: rule.lengthError,
        path: ['apiKey'],
      });
    }
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
