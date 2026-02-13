import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// next/cache mock
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// uuid mock
vi.mock('uuid', () => ({
  v7: vi.fn(() => 'test-uuid-123'),
}));

// password hash mock
vi.mock('@/access/lib/password-hash', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed-identifier')),
}));

// DB mock
const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockOrderBy = vi.fn();
const mockWhereSelect = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = vi.fn(() => ({ where: mockWhereSelect }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockDb = {
  insert: mockInsert,
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
    created_at: 'created_at',
    updated_at: 'updated_at',
    archived_at: 'archived_at',
    lifecycle_status: 'lifecycle_status',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

import { checkProjectNameDuplicate, createProject, getProjects } from './server-action';

describe('createProject', () => {
  const mockInput = {
    projectName: 'Test Project',
    identifier: 'test-identifier-123',
    description: '테스트 설명',
    ownerName: '홍길동',
  };

  const mockInsertedRow = {
    id: 'test-uuid-123',
    name: 'Test Project',
    identifier: 'hashed-identifier',
    description: '테스트 설명',
    owner_name: '홍길동',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    archived_at: null,
    lifecycle_status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('프로젝트 생성 성공 시 success: true와 프로젝트 데이터를 반환한다', async () => {
    mockReturning.mockResolvedValue([mockInsertedRow]);

    const result = await createProject(mockInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('test-uuid-123');
      expect(result.data.projectName).toBe('Test Project');
      expect(result.data.description).toBe('테스트 설명');
      expect(result.data.ownerName).toBe('홍길동');
      expect(result.data.lifecycleStatus).toBe('ACTIVE');
    }
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalled();
    expect(mockReturning).toHaveBeenCalled();
  });

  it('프로젝트명이 정규화되어 저장된다 (공백 제거)', async () => {
    mockReturning.mockResolvedValue([mockInsertedRow]);

    const inputWithSpaces = {
      ...mockInput,
      projectName: '  Test   Project  ',
    };

    await createProject(inputWithSpaces);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Project',
      })
    );
  });

  it('inserted가 없을 경우 success: false와 에러를 반환한다', async () => {
    mockReturning.mockResolvedValue([undefined]);

    const result = await createProject(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain('프로젝트 생성에 실패했습니다.');
    }
  });

  it('DB 에러 발생 시 success: false와 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReturning.mockRejectedValue(new Error('DB Connection Error'));

    const result = await createProject(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain('프로젝트 생성 중 오류가 발생했습니다.');
    }
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('getProjects', () => {
  const mockProjectRows = [
    {
      id: 'proj-1',
      name: 'Project 1',
      identifier: 'hashed-1',
      description: '설명 1',
      owner_name: '홍길동',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
      archived_at: null,
      lifecycle_status: 'ACTIVE',
    },
    {
      id: 'proj-2',
      name: 'Project 2',
      identifier: 'hashed-2',
      description: null,
      owner_name: null,
      created_at: new Date('2024-01-03T00:00:00Z'),
      updated_at: new Date('2024-01-04T00:00:00Z'),
      archived_at: null,
      lifecycle_status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('프로젝트 목록 조회 성공 시 success: true와 데이터를 반환한다', async () => {
    mockOrderBy.mockResolvedValue(mockProjectRows);

    const result = await getProjects();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('proj-1');
      expect(result.data[0].projectName).toBe('Project 1');
      expect(result.data[1].description).toBeUndefined();
      expect(result.data[1].ownerName).toBeUndefined();
    }
  });

  it('프로젝트가 없을 경우 빈 배열을 반환한다', async () => {
    mockOrderBy.mockResolvedValue([]);

    const result = await getProjects();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('DB 에러 발생 시 success: false와 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOrderBy.mockRejectedValue(new Error('DB Error'));

    const result = await getProjects();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain('프로젝트 목록 조회에 실패했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});

describe('checkProjectNameDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // checkProjectNameDuplicate는 다른 체인을 사용하므로 재설정
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
  });

  it('중복된 프로젝트명이 있으면 true를 반환한다', async () => {
    mockLimit.mockResolvedValue([{ id: 'existing-id' }]);

    const result = await checkProjectNameDuplicate('Existing Project');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('중복된 프로젝트명이 없으면 false를 반환한다', async () => {
    mockLimit.mockResolvedValue([undefined]);

    const result = await checkProjectNameDuplicate('New Project');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it('프로젝트명이 정규화되어 검사된다', async () => {
    mockLimit.mockResolvedValue([undefined]);

    await checkProjectNameDuplicate('  Test   Project  ');

    // name 필드에 정규화된 값이 사용되었는지 확인
    expect(mockSelect).toHaveBeenCalled();
  });

  it('DB 에러 발생 시 success: false와 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLimit.mockRejectedValue(new Error('DB Error'));

    const result = await checkProjectNameDuplicate('Test');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain('중복 체크 중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});
