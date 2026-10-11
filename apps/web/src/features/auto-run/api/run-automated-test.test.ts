// @vitest-environment node
import { requireProjectAccess } from '@/access/lib/require-access';
import { getTargetSiteForExecution } from '@/features/target-sites/api/get-target-site-for-execution';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateSpec } from '../lib/generate-spec';
import { recordAutoResult } from './record-result';
import { runAutomatedTest } from './run-automated-test';
import { captureSnapshot, runSpecOnRunner } from './runner-client';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@/features/target-sites/api/get-target-site-for-execution', () => ({
  getTargetSiteForExecution: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
vi.mock('../lib/generate-spec', () => ({ generateSpec: vi.fn() }));
vi.mock('./record-result', () => ({ recordAutoResult: vi.fn() }));
vi.mock('./runner-client', () => ({ captureSnapshot: vi.fn(), runSpecOnRunner: vi.fn() }));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const PROJECT_B = '00000000-0000-4000-8000-000000000002';
const params = {
  projectId: PROJECT_A,
  runId: '00000000-0000-4000-8000-000000000003',
  caseId: '00000000-0000-4000-8000-000000000004',
  targetSiteId: '00000000-0000-4000-8000-000000000005',
};
const limit = vi.fn();
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  limit.mockResolvedValueOnce([{ projectId: PROJECT_A }]).mockResolvedValue([
    {
      id: params.caseId,
      projectId: PROJECT_A,
      name: '정상 케이스',
      steps: '화면 확인',
      caseKey: 'TC-001',
    },
  ]);
  vi.mocked(getTargetSiteForExecution).mockResolvedValue({
    baseUrl: 'https://example.test',
    auth: null,
  } as Awaited<ReturnType<typeof getTargetSiteForExecution>>);
  vi.mocked(captureSnapshot).mockResolvedValue({ ok: true, snapshot: 'test snapshot' });
  vi.mocked(generateSpec).mockResolvedValue('// synthetic spec; never executed');
  vi.mocked(runSpecOnRunner).mockResolvedValue({ ok: true, status: 'passed', durationMs: 10 });
  vi.mocked(recordAutoResult).mockResolvedValue({ matched: true });
});

function expectNoExternalWork() {
  expect(getTargetSiteForExecution).not.toHaveBeenCalled();
  expect(captureSnapshot).not.toHaveBeenCalled();
  expect(generateSpec).not.toHaveBeenCalled();
  expect(runSpecOnRunner).not.toHaveBeenCalled();
  expect(recordAutoResult).not.toHaveBeenCalled();
}

describe('자동 실행 결과 대상의 프로젝트 경계', () => {
  it('무인증 요청은 조회와 외부 호출 전에 거부한다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect((await runAutomatedTest(params)).success).toBe(false);
    expect(db.select).not.toHaveBeenCalled();
    expectNoExternalWork();
  });

  it.each([
    ['다른 프로젝트 실행', [{ projectId: PROJECT_B }]],
    ['존재하지 않는 실행', []],
  ])('%s은 외부 호출과 결과 기록 전에 거부한다.', async (_label, rows) => {
    limit.mockReset().mockResolvedValue(rows);
    expect(await runAutomatedTest(params)).toEqual({
      success: false,
      errors: { _general: ['접근 권한이 없습니다.'] },
    });
    expectNoExternalWork();
  });

  it('같은 프로젝트의 정상 실행 결과를 기존 형식으로 기록한다.', async () => {
    expect(await runAutomatedTest(params)).toEqual({
      success: true,
      data: {
        specPreview: '// synthetic spec; never executed',
        status: 'passed',
        durationMs: 10,
        errorMessage: undefined,
        recorded: true,
        caseKey: 'TC-001',
      },
    });
    expect(recordAutoResult).toHaveBeenCalledWith(
      expect.objectContaining({ runId: params.runId, caseKey: 'TC-001', status: 'pass' })
    );
    expect(runSpecOnRunner).toHaveBeenCalledOnce();
  });
});
