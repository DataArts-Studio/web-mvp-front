import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Sentry mock
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// 접근 권한 mock
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/shared/lib/db/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));

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
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));

import { createMilestoneAction } from '@/features';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

describe('createMilestoneAction', () => {
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
      // @ts-expect-error -- 의도적으로 title 누락
      const result = await createMilestoneAction({
        projectId: validProjectId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors.title).toBeDefined();
      }
    });

    it('title이 빈 문자열이면 유효성 검사 에러를 반환한다', async () => {
      const result = await createMilestoneAction({
        title: '',
        projectId: validProjectId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors.title).toBeDefined();
      }
    });

    it('title이 50자를 초과하면 유효성 검사 에러를 반환한다', async () => {
      const result = await createMilestoneAction({
        title: 'a'.repeat(51),
        projectId: validProjectId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors.title).toBeDefined();
      }
    });

    it('projectId가 없으면 유효성 검사 에러를 반환한다', async () => {
      // @ts-expect-error -- 의도적으로 projectId 누락
      const result = await createMilestoneAction({
        title: '테스트 마일스톤',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors.projectId).toBeDefined();
      }
    });

    it('projectId가 유효한 UUID가 아니면 에러를 반환한다', async () => {
      const result = await createMilestoneAction({
        title: '테스트 마일스톤',
        projectId: 'invalid-uuid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors.projectId).toBeDefined();
      }
    });
  });

  describe('마일스톤 생성', () => {
    it('유효한 데이터로 마일스톤을 성공적으로 생성한다', async () => {
      const result = await createMilestoneAction({
        title: '테스트 마일스톤',
        projectId: validProjectId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.milestone).toBeDefined();
        expect(result.milestone!.id).toBe('milestone-123');
      }
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('description이 포함된 마일스톤을 생성할 수 있다', async () => {
      const result = await createMilestoneAction({
        title: '테스트 마일스톤',
        projectId: validProjectId,
        description: '마일스톤 설명입니다',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 발생 시 success: false를 반환한다', async () => {
      mockReturning.mockRejectedValueOnce(new Error('DB Error'));

      const result = await createMilestoneAction({
        title: '테스트 마일스톤',
        projectId: validProjectId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.formErrors).toContain('마일스톤 생성에 실패했습니다.');
      }
    });
  });
});
