import { requireProjectAccess } from '@/access/lib/require-access';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteTestRun } from './delete-test-run';
import { removeSuiteFromRun } from './remove-suite-from-run';
import { updateTestRunName } from './update-test-run-name';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const PROJECT_B = '00000000-0000-4000-8000-000000000002';
const RUN_ID = '00000000-0000-4000-8000-000000000003';
const SUITE_ID = '00000000-0000-4000-8000-000000000004';
const limit = vi.fn();
const returning = vi.fn();
const set = vi.fn(() => ({ where: vi.fn(() => ({ returning })) }));
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  update: vi.fn(() => ({ set })),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(false);
  limit.mockResolvedValue([{ projectId: PROJECT_A }]);
  returning.mockResolvedValue([{ id: RUN_ID, name: '새 이름' }]);
});

describe.each([
  ['실행 삭제', () => deleteTestRun(RUN_ID)],
  ['실행 이름 변경', () => updateTestRunName(RUN_ID, '  새 이름  ')],
  ['실행 스위트 제외', () => removeSuiteFromRun({ testRunId: RUN_ID, suiteId: SUITE_ID })],
] as const)('%s 접근 제어', (_name, action) => {
  it('인증되지 않은 요청은 변경하지 않는다.', async () => {
    expect(await action()).toEqual({
      success: false,
      errors: { _general: ['접근 권한이 없습니다.'] },
    });
    expect(requireProjectAccess).toHaveBeenCalledWith(PROJECT_A);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('다른 프로젝트 토큰으로 대상 실행을 변경할 수 없다.', async () => {
    limit.mockResolvedValue([{ projectId: PROJECT_B }]);
    vi.mocked(requireProjectAccess).mockImplementation(async (id) => id === PROJECT_A);
    expect((await action()).success).toBe(false);
    expect(requireProjectAccess).toHaveBeenCalledWith(PROJECT_B);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('실행이 없으면 변경하지 않는다.', async () => {
    limit.mockResolvedValue([]);
    expect((await action()).success).toBe(false);
    expect(requireProjectAccess).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('소유 프로젝트 권한이 있으면 기존 변경을 수행한다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(true);
    expect((await action()).success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });
});

it('정상 이름 변경은 공백을 제거한 기존 응답을 유지한다.', async () => {
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  expect(await updateTestRunName(RUN_ID, '  새 이름  ')).toEqual({
    success: true,
    data: { id: RUN_ID, name: '새 이름' },
  });
  expect(set).toHaveBeenCalledWith(expect.objectContaining({ name: '새 이름' }));
});
