import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkStorageLimit } from './check-storage-limit';

// 전역 setup 의 checkStorageLimit mock 을 이 파일에서는 해제하고 실제 구현을 검증한다.
vi.unmock('@/shared/lib/storage/check-storage-limit');

const mockGetProjectStorageBytes = vi.fn<() => Promise<number>>();

// 실제 의존성: checkStorageLimit 은 @testea/db 의 getProjectStorageBytes 를 사용한다.
vi.mock('@testea/db', () => ({
  getProjectStorageBytes: (...args: unknown[]) => mockGetProjectStorageBytes(...(args as [])),
}));

vi.mock('@/shared/constants/core', () => ({
  LIMITS: {
    MAX_STORAGE_BYTES: 20 * 1024 * 1024, // 20MB
    MAX_PROJECTS: 1,
  },
}));

describe('checkStorageLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('용량이 제한 미만이면 null을 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(0);

    const result = await checkStorageLimit('project-123');

    expect(result).toBeNull();
    expect(mockGetProjectStorageBytes).toHaveBeenCalledWith('project-123');
  });

  it('용량이 제한 직전이면 null을 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(20 * 1024 * 1024 - 1);

    const result = await checkStorageLimit('project-123');

    expect(result).toBeNull();
  });

  it('용량이 정확히 제한과 같으면 에러를 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(20 * 1024 * 1024);

    const result = await checkStorageLimit('project-123');

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    if (result && !result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(20MB)을 초과하였습니다.');
    }
  });

  it('용량이 제한을 초과하면 에러를 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(20 * 1024 * 1024 + 1);

    const result = await checkStorageLimit('project-123');

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    if (result && !result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(20MB)을 초과하였습니다.');
    }
  });
});
