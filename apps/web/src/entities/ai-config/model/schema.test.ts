import { describe, expect, it } from 'vitest';
import { SaveAiConfigSchema, GenerateCasesSchema, GeneratedTestCaseSchema, SaveGeneratedCasesSchema, API_KEY_RULES } from './schema';

// ============================================================================
// API_KEY_RULES 상수 검증
// ============================================================================
describe('API_KEY_RULES', () => {
  it('gemini 규칙이 올바른 접두사와 길이를 가진다', () => {
    expect(API_KEY_RULES.gemini.prefix).toBe('AIza');
    expect(API_KEY_RULES.gemini.minLength).toBe(39);
    expect(API_KEY_RULES.gemini.maxLength).toBe(39);
  });

  it('openai 규칙이 올바른 접두사와 길이를 가진다', () => {
    expect(API_KEY_RULES.openai.prefix).toBe('sk-');
    expect(API_KEY_RULES.openai.minLength).toBe(40);
    expect(API_KEY_RULES.openai.maxLength).toBe(200);
  });

  it('anthropic 규칙이 올바른 접두사와 길이를 가진다', () => {
    expect(API_KEY_RULES.anthropic.prefix).toBe('sk-ant-');
    expect(API_KEY_RULES.anthropic.minLength).toBe(40);
    expect(API_KEY_RULES.anthropic.maxLength).toBe(200);
  });
});

// ============================================================================
// SaveAiConfigSchema 유효성 검증
// ============================================================================
describe('SaveAiConfigSchema', () => {
  const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

  // --- Gemini ---
  describe('Gemini API 키 검증', () => {
    const validGeminiKey = 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA'; // 39자

    it('올바른 Gemini 키를 통과시킨다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: validGeminiKey,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 접두사의 Gemini 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: 'sk-wrongprefix1234567890123456789012345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find((e) => e.path.includes('apiKey'));
        expect(apiKeyError?.message).toContain('AIza');
      }
    });

    it('길이가 짧은 Gemini 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: 'AIzaShort',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find((e) => e.path.includes('apiKey'));
        expect(apiKeyError?.message).toContain('형식');
      }
    });

    it('길이가 긴 Gemini 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: 'AIza' + 'x'.repeat(40), // 44자
      });
      expect(result.success).toBe(false);
    });
  });

  // --- OpenAI ---
  describe('OpenAI API 키 검증', () => {
    const validOpenAiKey = 'sk-' + 'a'.repeat(45); // 48자

    it('올바른 OpenAI 키를 통과시킨다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'openai',
        apiKey: validOpenAiKey,
      });
      expect(result.success).toBe(true);
    });

    it('긴 프로젝트 키(sk-proj-)도 통과시킨다', () => {
      const longKey = 'sk-proj-' + 'a'.repeat(150); // 158자
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'openai',
        apiKey: longKey,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 접두사의 OpenAI 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'openai',
        apiKey: 'AIza' + 'a'.repeat(45),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find((e) => e.path.includes('apiKey'));
        expect(apiKeyError?.message).toContain('sk-');
      }
    });

    it('200자를 초과하는 OpenAI 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'openai',
        apiKey: 'sk-' + 'a'.repeat(200), // 203자
      });
      expect(result.success).toBe(false);
    });
  });

  // --- Anthropic ---
  describe('Anthropic API 키 검증', () => {
    const validAnthropicKey = 'sk-ant-api03-' + 'a'.repeat(40); // 52자

    it('올바른 Anthropic 키를 통과시킨다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'anthropic',
        apiKey: validAnthropicKey,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 접두사의 Anthropic 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'anthropic',
        apiKey: 'sk-' + 'a'.repeat(50),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find((e) => e.path.includes('apiKey'));
        expect(apiKeyError?.message).toContain('sk-ant-');
      }
    });
  });

  // --- 공통 ---
  describe('공통 유효성 검증', () => {
    it('빈 API 키를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: '',
      });
      expect(result.success).toBe(false);
    });

    it('잘못된 provider를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'mistral',
        apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
      });
      expect(result.success).toBe(false);
    });

    it('잘못된 UUID를 거부한다', () => {
      const result = SaveAiConfigSchema.safeParse({
        projectId: 'not-a-uuid',
        provider: 'gemini',
        apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
      });
      expect(result.success).toBe(false);
    });

    it('model 필드는 선택사항이다', () => {
      const withModel = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
        model: 'gemini-2.5-flash-lite',
      });
      const withoutModel = SaveAiConfigSchema.safeParse({
        projectId: validProjectId,
        provider: 'gemini',
        apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
      });
      expect(withModel.success).toBe(true);
      expect(withoutModel.success).toBe(true);
    });
  });
});

// ============================================================================
// GenerateCasesSchema
// ============================================================================
describe('GenerateCasesSchema', () => {
  const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

  it('유효한 입력을 통과시킨다', () => {
    const result = GenerateCasesSchema.safeParse({
      projectId: validProjectId,
      description: '사용자가 로그인 버튼을 클릭하면 로그인 모달이 열린다',
    });
    expect(result.success).toBe(true);
  });

  it('20자 미만 설명을 거부한다', () => {
    const result = GenerateCasesSchema.safeParse({
      projectId: validProjectId,
      description: '짧은 설명',
    });
    expect(result.success).toBe(false);
  });

  it('3000자 초과 설명을 거부한다', () => {
    const result = GenerateCasesSchema.safeParse({
      projectId: validProjectId,
      description: 'a'.repeat(3001),
    });
    expect(result.success).toBe(false);
  });

  it('language 기본값은 ko이다', () => {
    const result = GenerateCasesSchema.safeParse({
      projectId: validProjectId,
      description: '사용자가 로그인 버튼을 클릭하면 로그인 모달이 열린다',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('ko');
    }
  });
});

// ============================================================================
// GeneratedTestCaseSchema
// ============================================================================
describe('GeneratedTestCaseSchema', () => {
  it('유효한 케이스를 통과시킨다', () => {
    const result = GeneratedTestCaseSchema.safeParse({
      name: '로그인 성공 테스트',
      preCondition: '유효한 계정 존재',
      steps: '1. 이메일 입력\n2. 비밀번호 입력\n3. 로그인 클릭',
      expectedResult: '대시보드로 이동',
      tags: ['auth', 'login'],
      category: 'positive',
    });
    expect(result.success).toBe(true);
  });

  it('name이 빈 문자열이면 거부한다', () => {
    const result = GeneratedTestCaseSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('name이 200자를 초과하면 거부한다', () => {
    const result = GeneratedTestCaseSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('tags가 5개를 초과하면 거부한다', () => {
    const result = GeneratedTestCaseSchema.safeParse({
      name: '테스트',
      tags: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(result.success).toBe(false);
  });

  it('선택 필드에 기본값이 적용된다', () => {
    const result = GeneratedTestCaseSchema.safeParse({ name: '테스트' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preCondition).toBe('');
      expect(result.data.steps).toBe('');
      expect(result.data.expectedResult).toBe('');
      expect(result.data.tags).toEqual([]);
      expect(result.data.category).toBe('positive');
    }
  });
});

// ============================================================================
// SaveGeneratedCasesSchema
// ============================================================================
describe('SaveGeneratedCasesSchema', () => {
  const validProjectId = '550e8400-e29b-41d4-a716-446655440000';

  it('유효한 케이스 목록을 통과시킨다', () => {
    const result = SaveGeneratedCasesSchema.safeParse({
      projectId: validProjectId,
      cases: [{ name: '테스트 1' }, { name: '테스트 2' }],
    });
    expect(result.success).toBe(true);
  });

  it('빈 배열을 거부한다', () => {
    const result = SaveGeneratedCasesSchema.safeParse({
      projectId: validProjectId,
      cases: [],
    });
    expect(result.success).toBe(false);
  });

  it('20개 초과를 거부한다', () => {
    const cases = Array.from({ length: 21 }, (_, i) => ({ name: `TC ${i}` }));
    const result = SaveGeneratedCasesSchema.safeParse({
      projectId: validProjectId,
      cases,
    });
    expect(result.success).toBe(false);
  });

  it('suiteId는 선택사항이다', () => {
    const result = SaveGeneratedCasesSchema.safeParse({
      projectId: validProjectId,
      suiteId: '660e8400-e29b-41d4-a716-446655440000',
      cases: [{ name: '테스트' }],
    });
    expect(result.success).toBe(true);
  });
});
