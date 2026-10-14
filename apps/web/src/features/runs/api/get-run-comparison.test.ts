import { requireProjectAccess } from '@/access/lib/require-access';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRunComparison } from './get-run-comparison';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const PROJECT_B = '00000000-0000-4000-8000-000000000002';
const RUN_ID = '00000000-0000-4000-8000-000000000003';
const limit = vi.fn();
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  limit.mockResolvedValue([{ projectId: PROJECT_A }]);
});

describe('getRunComparison 접근 제어', () => {
  it('인증되지 않은 요청은 비교 데이터를 주지 않는다', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect(await getRunComparison(RUN_ID)).toEqual({
      success: false,
      errors: { _general: ['접근 권한이 없습니다.'] },
    });
    expect(requireProjectAccess).toHaveBeenCalledWith(PROJECT_A);
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('다른 프로젝트 토큰으로는 대상 실행의 비교 데이터를 볼 수 없다', async () => {
    limit.mockResolvedValue([{ projectId: PROJECT_B }]);
    vi.mocked(requireProjectAccess).mockImplementation(async (id) => id === PROJECT_A);
    expect((await getRunComparison(RUN_ID)).success).toBe(false);
    expect(requireProjectAccess).toHaveBeenCalledWith(PROJECT_B);
  });
});
