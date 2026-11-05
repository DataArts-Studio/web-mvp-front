import {
  createMockMilestoneRow,
  mockDb,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateMilestone } from './server-actions';

vi.mock('@testea/db', () => ({
  getDatabase: mockGetDatabase,
  milestones: { id: 'id', name: 'name' },
}));

describe('updateMilestone', () => {
  beforeEach(() => {
    resetMockDb();
    // 인가 프리플라이트 조회(대상 소유 프로젝트 확인)용 기본 반환
    setMockSelectReturn([{ projectId: 'project-123', project_id: 'project-123' }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('마일스톤 정보를 수정하면 업데이트된 데이터를 반환한다', async () => {
    const mockRow = createMockMilestoneRow({ name: 'Updated Milestone' });
    setMockUpdateReturn(mockRow);

    const result = await updateMilestone({ id: mockRow.id, title: 'Updated Milestone' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Updated Milestone');
      expect(result.message).toBe('마일스톤이 수정되었습니다.');
    }
  });

  it('수정할 마일스톤이 존재하지 않으면 에러를 반환한다', async () => {
    setMockUpdateReturn(undefined);

    const result = await updateMilestone({ id: 'non-existent-id', title: 'New Name' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤 수정에 실패했습니다.');
    }
  });

  it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await updateMilestone({ id: 'any-id', title: 'New Name' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤을 수정하는 도중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });

  describe('날짜 (#381)', () => {
    const setCall = () => mockDb.update.mock.results[0].value.set.mock.calls[0][0];

    it('고른 날짜를 시간대 변환 없이 그대로 저장한다', async () => {
      setMockUpdateReturn(createMockMilestoneRow());

      const result = await updateMilestone({
        id: 'milestone-123',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(result.success).toBe(true);
      expect(setCall()).toMatchObject({ start_date: '2026-10-01', end_date: '2026-10-31' });
    });

    it('종료일이 시작일보다 빠르면 저장하지 않는다', async () => {
      const result = await updateMilestone({
        id: 'milestone-123',
        startDate: '2026-10-10',
        endDate: '2026-10-01',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain('종료일은 시작일보다 빠를 수 없습니다.');
      }
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('한쪽만 바꿔도 기존 날짜와 합쳐 기간 순서를 확인한다', async () => {
      setMockSelectReturn([
        { projectId: 'project-123', startDate: '2026-10-10', endDate: '2026-10-20' },
      ]);

      const result = await updateMilestone({ id: 'milestone-123', endDate: '2026-10-05' });

      expect(result.success).toBe(false);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('형식이 틀린 날짜는 거부한다', async () => {
      const result = await updateMilestone({ id: 'milestone-123', startDate: '2026-02-30' });

      expect(result.success).toBe(false);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
