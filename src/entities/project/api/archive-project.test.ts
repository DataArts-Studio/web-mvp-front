import {
  createMockProjectRow,
  mockDb,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { archiveProject } from './server-actions';

vi.mock('@/shared/lib/db', () => ({
  getDatabase: mockGetDatabase,
  projects: { id: 'id', archived_at: 'archived_at', lifecycle_status: 'lifecycle_status' },
}));

describe('archiveProject', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('프로젝트를 아카이브(Soft Delete)하면 성공 메시지와 ID를 반환한다', async () => {
    const projectId = 'test-project-id';
    const mockArchivedProject = createMockProjectRow({ id: projectId });
    setMockUpdateReturn(mockArchivedProject);

    const result = await archiveProject(projectId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(projectId);
      expect(result.message).toBe('프로젝트가 성공적으로 삭제되었습니다.');
    }
  });

  it('아카이브할 프로젝트가 존재하지 않으면 에러 메시지를 반환한다', async () => {
    setMockUpdateReturn(undefined);
    const result = await archiveProject('non-existent-id');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 찾을 수 없습니다.');
    }
  });

  it('데이터베이스 업데이트 중 오류가 발생하면 에러 메시지를 반환한다', async () => {
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });
    const result = await archiveProject('any-id');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._project).toContain('프로젝트를 삭제하는 도중 오류가 발생했습니다.');
    }
  });
});
