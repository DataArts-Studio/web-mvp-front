import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================
const mockEncrypt = vi.fn((key: string) => `encrypted_${key}`);
const mockDecrypt = vi.fn((key: string) => key.replace('encrypted_', ''));

vi.mock('@/shared/lib/crypto', () => ({
  encrypt: (key: string) => mockEncrypt(key),
  decrypt: (key: string) => mockDecrypt(key),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// DB mock with full chain support
const mockReturning = vi.fn();
const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({
  returning: mockReturning,
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

const mockDb = {
  insert: mockInsert,
  select: mockSelect,
  update: mockUpdate,
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  projectAiConfigs: {
    id: 'id',
    project_id: 'project_id',
    provider: 'provider',
    api_key: 'api_key',
    model: 'model',
    lifecycle_status: 'lifecycle_status',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  testCases: {
    id: 'id',
    project_id: 'project_id',
    display_id: 'display_id',
  },
}));

// ============================================================================
// Constants
// ============================================================================
const PROJECT_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_DATE = new Date('2026-03-08');

const createMockAiConfigRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'config-123',
  project_id: PROJECT_ID,
  provider: 'gemini',
  api_key: 'encrypted_AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
  model: null,
  lifecycle_status: 'ACTIVE',
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// saveAiConfig
// ============================================================================
describe('saveAiConfig', () => {
  let saveAiConfig: typeof import('./server-actions').saveAiConfig;

  beforeEach(async () => {
    const mod = await import('./server-actions');
    saveAiConfig = mod.saveAiConfig;
  });

  it('유효한 Gemini 키로 설정을 저장한다 (upsert)', async () => {
    const mockRow = createMockAiConfigRow();
    mockReturning.mockResolvedValue([mockRow]);

    const result = await saveAiConfig({
      projectId: PROJECT_ID,
      provider: 'gemini',
      apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config.provider).toBe('gemini');
      expect(result.data.config.hasApiKey).toBe(true);
      expect(result.data.config.projectId).toBe(PROJECT_ID);
    }
    expect(mockEncrypt).toHaveBeenCalledWith('AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
  });

  it('잘못된 접두사의 키를 거부한다', async () => {
    const result = await saveAiConfig({
      projectId: PROJECT_ID,
      provider: 'gemini',
      apiKey: 'wrong-prefix-key-1234567890123456789',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._ai).toBeDefined();
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('빈 API 키를 거부한다', async () => {
    const result = await saveAiConfig({
      projectId: PROJECT_ID,
      provider: 'gemini',
      apiKey: '',
    });

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('DB 에러 시 에러 응답을 반환한다', async () => {
    mockReturning.mockRejectedValue(new Error('DB error'));

    const result = await saveAiConfig({
      projectId: PROJECT_ID,
      provider: 'gemini',
      apiKey: 'AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._ai).toContain('AI 설정 저장에 실패했습니다.');
    }
  });
});

// ============================================================================
// getAiConfig
// ============================================================================
describe('getAiConfig', () => {
  let getAiConfig: typeof import('./server-actions').getAiConfig;

  beforeEach(async () => {
    const mod = await import('./server-actions');
    getAiConfig = mod.getAiConfig;
  });

  it('ACTIVE 설정이 있으면 반환한다', async () => {
    const mockRow = createMockAiConfigRow();
    mockLimit.mockResolvedValue([mockRow]);

    const result = await getAiConfig(PROJECT_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toBeNull();
      expect(result.data!.provider).toBe('gemini');
      expect(result.data!.hasApiKey).toBe(true);
    }
  });

  it('설정이 없으면 null을 반환한다', async () => {
    mockLimit.mockResolvedValue([]);

    const result = await getAiConfig(PROJECT_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it('DB 에러 시 에러 응답을 반환한다', async () => {
    mockLimit.mockRejectedValue(new Error('DB error'));

    const result = await getAiConfig(PROJECT_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._ai).toContain('AI 설정을 불러올 수 없습니다.');
    }
  });
});

// ============================================================================
// getDecryptedApiKey
// ============================================================================
describe('getDecryptedApiKey', () => {
  let getDecryptedApiKey: typeof import('./server-actions').getDecryptedApiKey;

  beforeEach(async () => {
    const mod = await import('./server-actions');
    getDecryptedApiKey = mod.getDecryptedApiKey;
  });

  it('복호화된 키를 반환한다', async () => {
    const mockRow = createMockAiConfigRow();
    mockLimit.mockResolvedValue([mockRow]);

    const result = await getDecryptedApiKey(PROJECT_ID);

    expect(result).not.toBeNull();
    expect(result!.provider).toBe('gemini');
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted_AIzaSyCQeNta_oe4A-xlURzdEYZlx31-XsPIsAA');
  });

  it('설정이 없으면 null을 반환한다', async () => {
    mockLimit.mockResolvedValue([]);

    const result = await getDecryptedApiKey(PROJECT_ID);

    expect(result).toBeNull();
    expect(mockDecrypt).not.toHaveBeenCalled();
  });
});

// ============================================================================
// deleteAiConfig (소프트 딜리트)
// ============================================================================
describe('deleteAiConfig', () => {
  let deleteAiConfig: typeof import('./server-actions').deleteAiConfig;

  beforeEach(async () => {
    const mod = await import('./server-actions');
    deleteAiConfig = mod.deleteAiConfig;
  });

  it('소프트 딜리트로 lifecycle_status를 DELETED로 변경한다', async () => {
    mockUpdateWhere.mockResolvedValue(undefined);

    const result = await deleteAiConfig(PROJECT_ID);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ lifecycle_status: 'DELETED' }),
    );
  });

  it('물리적 삭제(db.delete)를 호출하지 않는다', async () => {
    mockUpdateWhere.mockResolvedValue(undefined);

    await deleteAiConfig(PROJECT_ID);

    // db.delete가 mockDb에 없으므로 호출되지 않음을 확인
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('DB 에러 시 에러 응답을 반환한다', async () => {
    mockUpdateWhere.mockRejectedValue(new Error('DB error'));

    const result = await deleteAiConfig(PROJECT_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._ai).toContain('AI 설정 삭제에 실패했습니다.');
    }
  });
});

// ============================================================================
// saveGeneratedCases
// ============================================================================
describe('saveGeneratedCases', () => {
  let saveGeneratedCases: typeof import('./server-actions').saveGeneratedCases;

  beforeEach(async () => {
    const mod = await import('./server-actions');
    saveGeneratedCases = mod.saveGeneratedCases;
  });

  it('유효한 케이스를 저장한다', async () => {
    // select().from().where() 체인이 Promise.resolve([{ max: 5 }])를 반환하도록
    mockSelectFrom.mockReturnValue({
      where: vi.fn(() => Promise.resolve([{ max: 5 }])),
    });
    // insert().values()가 반환만 하면 됨 (returning 없이)
    mockValues.mockReturnValue(Promise.resolve());

    const result = await saveGeneratedCases({
      projectId: PROJECT_ID,
      cases: [
        { name: '테스트 케이스 1' },
        { name: '테스트 케이스 2' },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(2);
    }
  });

  it('빈 케이스 배열을 거부한다', async () => {
    const result = await saveGeneratedCases({
      projectId: PROJECT_ID,
      cases: [],
    });

    expect(result.success).toBe(false);
  });

  it('20개를 초과하는 케이스를 거부한다', async () => {
    const cases = Array.from({ length: 21 }, (_, i) => ({ name: `케이스 ${i + 1}` }));

    const result = await saveGeneratedCases({
      projectId: PROJECT_ID,
      cases,
    });

    expect(result.success).toBe(false);
  });
});
