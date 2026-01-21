import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Insert chain mock
const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockDb = {
  insert: mockInsert,
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  milestones: {
    id: 'id',
    project_id: 'project_id',
    name: 'name',
    description: 'description',
    start_date: 'start_date',
    end_date: 'end_date',
    progress_status: 'progress_status',
    lifecycle_status: 'lifecycle_status',
  },
}));

import { createMilestoneAction } from './server-action';

describe('createMilestoneAction', () => {
  const createFormData = (data: Record<string, string | Date | null | undefined>) => {
    const formData = new Map<string, string>();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, value instanceof Date ? value.toISOString() : String(value));
      }
    });
    return {
      entries: () => formData.entries(),
    };
  };

  const validProjectId = '01932d3e-4567-7890-abcd-ef1234567890';

  const mockCreatedMilestone = {
    id: 'milestone-123',
    project_id: validProjectId,
    name: '테스트 마일스톤',
    description: '설명',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    progress_status: 'planned',
    lifecycle_status: 'ACTIVE',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    archived_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([mockCreatedMilestone]);
  });

  describe('유효성 검사', () => {
    it('title이 없으면 유효성 검사 에러를 반환한다', async () => {
      const formData = createFormData({
        projectId: validProjectId,
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.title).toBeDefined();
      }
    });

    it('title이 빈 문자열이면 유효성 검사 에러를 반환한다', async () => {
      const formData = createFormData({
        title: '',
        projectId: validProjectId,
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.title).toBeDefined();
      }
    });

    it('title이 50자를 초과하면 유효성 검사 에러를 반환한다', async () => {
      const formData = createFormData({
        title: 'a'.repeat(51),
        projectId: validProjectId,
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.title).toBeDefined();
      }
    });

    it('projectId가 없으면 유효성 검사 에러를 반환한다', async () => {
      const formData = createFormData({
        title: '테스트 마일스톤',
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.projectId).toBeDefined();
      }
    });

    it('projectId가 유효한 UUID가 아니면 에러를 반환한다', async () => {
      const formData = createFormData({
        title: '테스트 마일스톤',
        projectId: 'invalid-uuid',
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.projectId).toBeDefined();
      }
    });
  });

  describe('마일스톤 생성', () => {
    it('유효한 데이터로 마일스톤을 성공적으로 생성한다', async () => {
      const formData = createFormData({
        title: '테스트 마일스톤',
        projectId: validProjectId,
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.milestone).toBeDefined();
        expect(result.milestone[0].id).toBe('milestone-123');
      }
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('description이 포함된 마일스톤을 생성할 수 있다', async () => {
      const formData = createFormData({
        title: '테스트 마일스톤',
        projectId: validProjectId,
        description: '마일스톤 설명입니다',
      });

      const result = await createMilestoneAction(formData);

      expect(result.success).toBe(true);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '마일스톤 설명입니다',
        })
      );
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 발생 시 에러를 throw한다', async () => {
      mockReturning.mockRejectedValueOnce(new Error('DB Error'));

      const formData = createFormData({
        title: '테스트 마일스톤',
        projectId: validProjectId,
      });

      await expect(createMilestoneAction(formData)).rejects.toThrow('DB Error');
    });
  });
});
