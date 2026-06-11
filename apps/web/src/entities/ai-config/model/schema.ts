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
    // model 은 요청 URL(예: Gemini models/<model>)에 보간되므로 경로·쿼리 조작 방지를 위해
    // 안전 문자만 허용한다. (영숫자·점·하이픈·언더스코어, 빈 값은 기본 모델 사용)
    model: z
      .string()
      .regex(/^[A-Za-z0-9._-]*$/, '허용되지 않은 모델 이름입니다.')
      .optional(),
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

/**
 * multipart 경로용 검증 스키마 (FDD-TC11 V2 / 이슈 #132).
 *
 * 파일 첨부가 있을 때는 description 이 없어도 되고 길이 제한도 풀린다.
 * 라우트 핸들러가 파일 유무를 보고 최소 길이를 별도로 강제한다.
 */
export const GenerateCasesMultipartSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().max(3000, '설명은 3,000자를 초과할 수 없습니다').optional().default(''),
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
