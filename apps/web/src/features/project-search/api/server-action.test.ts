import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Chainable mock
const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
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
    created_at: 'created_at',
    owner_name: 'owner_name',
    lifecycle_status: 'lifecycle_status',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  ilike: vi.fn((field, pattern) => ({ ilike: { field, pattern } })),
  and: vi.fn((...conditions) => ({ and: conditions })),
  desc: vi.fn((field) => ({ desc: field })),
}));

import { searchProjects } from './server-action';

describe('searchProjects', () => {
  const mockProjectRows = [
    {
      id: 'proj-1',
      name: 'Test Project',
      created_at: new Date('2024-01-01T00:00:00Z'),
      owner_name: '홍길동',
    },
    {
      id: 'proj-2',
      name: 'Another Test',
      created_at: new Date('2024-01-02T00:00:00Z'),
      owner_name: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue(mockProjectRows);
  });

  describe('유효성 검사', () => {
    it('키워드가 2자 미만이면 에러를 반환한다', async () => {
      const result = await searchProjects('a');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('키워드가 50자 초과하면 에러를 반환한다', async () => {
      const longKeyword = 'a'.repeat(51);

      const result = await searchProjects(longKeyword);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('허용되지 않는 특수문자가 포함되면 에러를 반환한다', async () => {
      const result = await searchProjects('test@#$%');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('빈 문자열은 에러를 반환한다', async () => {
      const result = await searchProjects('');

      expect(result.success).toBe(false);
    });

    it('공백만 있으면 에러를 반환한다', async () => {
      const result = await searchProjects('   ');

      expect(result.success).toBe(false);
    });
  });

  describe('검색 성공', () => {
    it('유효한 키워드로 검색하면 프로젝트 목록을 반환한다', async () => {
      const result = await searchProjects('Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('proj-1');
        expect(result.data[0].projectName).toBe('Test Project');
        expect(result.data[1].ownerName).toBeUndefined();
      }
    });

    it('한글 키워드로 검색이 가능하다', async () => {
      const result = await searchProjects('프로젝트');

      expect(result.success).toBe(true);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('숫자가 포함된 키워드로 검색이 가능하다', async () => {
      const result = await searchProjects('test123');

      expect(result.success).toBe(true);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('하이픈과 언더스코어가 포함된 키워드로 검색이 가능하다', async () => {
      const result = await searchProjects('test-project_name');

      expect(result.success).toBe(true);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('검색 결과가 있으면 메시지를 포함한다', async () => {
      const result = await searchProjects('Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toContain('2건의 프로젝트');
      }
    });

    it('검색 결과가 없으면 빈 배열과 메시지 없음을 반환한다', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await searchProjects('NoMatch');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        expect(result.message).toBeUndefined();
      }
    });

    it('키워드 앞뒤 공백은 자동으로 제거된다', async () => {
      const result = await searchProjects('  Test  ');

      expect(result.success).toBe(true);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLimit.mockRejectedValue(new Error('DB Error'));

      const result = await searchProjects('Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('검색 중 오류가 발생했습니다');
      }
      consoleErrorSpy.mockRestore();
    });
  });
});
