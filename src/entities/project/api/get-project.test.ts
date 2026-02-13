import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Custom mock for this test file - supports the exact chain pattern used in server-actions
let mockSelectResult: unknown[] = [];

const mockLimit = vi.fn(() => Promise.resolve(mockSelectResult));
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockDb = {
  select: mockSelect,
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  projects: {
    id: 'id',
    name: 'name',
    identifier: 'identifier',
    description: 'description',
    owner_name: 'owner_name',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

import { getProjectById, getProjectByName } from './server-actions';

const createMockProjectRow = (overrides: Partial<{
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  owner_name: string | null;
}> = {}) => ({
  id: overrides.id ?? 'project-123',
  name: overrides.name ?? '테스트 프로젝트',
  identifier: overrides.identifier ?? 'TPJ',
  description: 'description' in overrides ? overrides.description : '테스트 설명',
  owner_name: 'owner_name' in overrides ? overrides.owner_name : '관리자',
});

describe('getProjectByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('프로젝트명으로 조회 성공 시 프로젝트 정보를 반환한다', async () => {
    const mockProject = createMockProjectRow({
      id: 'proj-123',
      name: 'Test Project',
      identifier: 'TP',
      description: '테스트 설명',
      owner_name: '홍길동',
    });
    mockSelectResult = [mockProject];

    const result = await getProjectByName('Test Project');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('proj-123');
      expect(result.data.projectName).toBe('Test Project');
      expect(result.data.description).toBe('테스트 설명');
      expect(result.data.ownerName).toBe('홍길동');
    }
  });

  it('description과 owner_name이 null이면 undefined로 변환된다', async () => {
    const mockProject = createMockProjectRow({
      id: 'proj-123',
      name: 'Test Project',
      description: null,
      owner_name: null,
    });
    mockSelectResult = [mockProject];

    const result = await getProjectByName('Test Project');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.ownerName).toBeUndefined();
    }
  });

  it('프로젝트가 존재하지 않으면 에러를 반환한다', async () => {
    mockSelectResult = [];

    const result = await getProjectByName('NonExistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 찾을 수 없습니다.');
    }
  });

  it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelect.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await getProjectByName('Test');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 불러오는 도중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});

describe('getProjectById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ID로 조회 성공 시 프로젝트 정보를 반환한다', async () => {
    const mockProject = createMockProjectRow({
      id: 'proj-456',
      name: 'Another Project',
      identifier: 'AP',
      description: '다른 프로젝트',
      owner_name: '김철수',
    });
    mockSelectResult = [mockProject];

    const result = await getProjectById('proj-456');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('proj-456');
      expect(result.data.projectName).toBe('Another Project');
      expect(result.data.description).toBe('다른 프로젝트');
      expect(result.data.ownerName).toBe('김철수');
    }
  });

  it('description과 owner_name이 null이면 undefined로 변환된다', async () => {
    const mockProject = createMockProjectRow({
      id: 'proj-456',
      name: 'Another Project',
      description: null,
      owner_name: null,
    });
    mockSelectResult = [mockProject];

    const result = await getProjectById('proj-456');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.ownerName).toBeUndefined();
    }
  });

  it('프로젝트가 존재하지 않으면 에러를 반환한다', async () => {
    mockSelectResult = [];

    const result = await getProjectById('non-existent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 찾을 수 없습니다.');
    }
  });

  it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelect.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await getProjectById('proj-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 불러오는 도중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});
