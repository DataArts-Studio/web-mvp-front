import { CreateMilestone, MilestoneDTO } from '@/entities/milestone';
import { type Mock, vi } from 'vitest';








// 모킹된 DB 결과를 저장할 변수
let mockReturnValue: unknown = [];
let mockInsertReturnValue: unknown = undefined;
let mockUpdateReturnValue: unknown = undefined;

// 체이닝을 위한 mock 객체
const createMockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(() =>
    Promise.resolve(mockInsertReturnValue ?? mockUpdateReturnValue ?? mockReturnValue)
  ),
  then: vi.fn((resolve) => Promise.resolve(mockReturnValue).then(resolve)),
});

const mockQueryBuilder = createMockQueryBuilder();

// select().from().where() 체인의 결과를 Promise로 만들기 위한 처리
const selectMock = vi.fn(() => {
  const chain = {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve(mockReturnValue)),
        })),
        then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
      })),
      limit: vi.fn(() => ({
        offset: vi.fn(() => Promise.resolve(mockReturnValue)),
      })),
      then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
    })),
  };
  return chain;
});

const insertMock = vi.fn(() => ({
  values: vi.fn(() => ({
    returning: vi.fn(() => Promise.resolve(mockInsertReturnValue ? [mockInsertReturnValue] : [])),
  })),
}));

const updateMock = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(mockUpdateReturnValue ? [mockUpdateReturnValue] : [])),
    })),
  })),
}));

export const mockDb: any = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(mockReturnValue)),
      then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(mockInsertReturnValue ? [mockInsertReturnValue] : [])),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(mockUpdateReturnValue ? [mockUpdateReturnValue] : [])),
      })),
    })),
  })),
  delete: vi.fn().mockReturnThis(),
};

export const mockGetDatabase: Mock<any> = vi.fn(() => mockDb);

// 테스트에서 반환값을 설정하는 헬퍼 함수들
export const setMockSelectReturn = (value: unknown) => {
  mockReturnValue = value;
};

export const setMockInsertReturn = (value: unknown) => {
  mockInsertReturnValue = value;
};

export const setMockUpdateReturn = (value: unknown) => {
  mockUpdateReturnValue = value;
};

export const resetMockDb = () => {
  mockReturnValue = [];
  mockInsertReturnValue = undefined;
  mockUpdateReturnValue = undefined;
  vi.clearAllMocks();
};

// 테스트용 fixture 데이터
export const createMockTestSuiteRow = (
  overrides: Partial<{
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    sort_order: number | null;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
    lifecycle_status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  }> = {}
) => ({
  id: overrides.id ?? '01234567-89ab-cdef-0123-456789abcdef',
  project_id: overrides.project_id ?? 'project-123',
  name: overrides.name ?? '테스트 스위트 제목입니다',
  description: 'description' in overrides ? overrides.description : '테스트 설명',
  sort_order: 'sort_order' in overrides ? overrides.sort_order : 0,
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
  archived_at: 'archived_at' in overrides ? overrides.archived_at : null,
  lifecycle_status: overrides.lifecycle_status ?? 'ACTIVE',
});

export const createMockCreateTestSuiteInput = (
  overrides: Partial<{
    projectId: string;
    title: string;
    description: string;
    sortOrder: number;
  }> = {}
) => ({
  projectId: overrides.projectId ?? 'project-123',
  title: overrides.title ?? '테스트 스위트 제목입니다',
  description: overrides.description ?? '테스트 설명',
  sortOrder: overrides.sortOrder ?? 0,
});

export const createMockCreateMilestoneInput = (
  overrides?: Partial<CreateMilestone>
): CreateMilestone => ({
  projectId: 'project-123',
  title: '테스트 마일스톤',
  description: '테스트용 마일스톤 설명입니다.',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  ...overrides,
});

export const createMockMilestoneRow = (overrides?: Partial<MilestoneDTO>): MilestoneDTO => ({
  id: 'milestone-123',
  project_id: 'project-123',
  name: '테스트 마일스톤',
  description: '테스트용 마일스톤 설명입니다.',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  progress_status: 'planned',
  created_at: new Date(),
  updated_at: new Date(),
  archived_at: null,
  lifecycle_status: 'ACTIVE',
  ...overrides,
});
