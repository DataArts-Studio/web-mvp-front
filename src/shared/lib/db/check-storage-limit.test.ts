import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetProjectStorageBytes = vi.fn<() => Promise<number>>();

vi.mock('./get-project-storage', () => ({
  getProjectStorageBytes: (...args: unknown[]) => mockGetProjectStorageBytes(...(args as [])),
}));

vi.mock('@/shared/constants/core', () => ({
  LIMITS: {
    MAX_STORAGE_BYTES: 50 * 1024 * 1024, // 50MB
    MAX_PROJECTS: 1,
  },
}));

import { checkStorageLimit } from './check-storage-limit';

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
    mockGetProjectStorageBytes.mockResolvedValue(50 * 1024 * 1024 - 1);

    const result = await checkStorageLimit('project-123');

    expect(result).toBeNull();
  });

  it('용량이 정확히 제한과 같으면 에러를 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(50 * 1024 * 1024);

    const result = await checkStorageLimit('project-123');

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    if (result && !result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
  });

  it('용량이 제한을 초과하면 에러를 반환한다', async () => {
    mockGetProjectStorageBytes.mockResolvedValue(50 * 1024 * 1024 + 1);

    const result = await checkStorageLimit('project-123');

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    if (result && !result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
  });
});
