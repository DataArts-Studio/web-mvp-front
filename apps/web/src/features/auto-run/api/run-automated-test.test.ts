// @vitest-environment node
import { requireProjectAccess } from '@/access/lib/require-access';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { AiError } from '@/entities/ai-config/model/ai-error';
import { getTargetSiteForExecution } from '@/features/target-sites/api/get-target-site-for-execution';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateSpec } from '../lib/generate-spec';
import { findCaseSpec, saveDraftSpec } from './case-spec-store';
import { recordAutoResult } from './record-result';
import { runAutomatedTest } from './run-automated-test';
import { captureSnapshot, runSpecOnRunner } from './runner-client';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@/entities/ai-config/api/decrypt-api-key', () => ({ getDecryptedApiKey: vi.fn() }));
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
vi.mock('./case-spec-store', () => ({ findCaseSpec: vi.fn(), saveDraftSpec: vi.fn() }));
vi.mock('./runner-client', () => ({ captureSnapshot: vi.fn(), runSpecOnRunner: vi.fn() }));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const PROJECT_B = '00000000-0000-4000-8000-000000000002';
// 프로젝트에 등록한 AI 설정. 누가 봐도 가짜인 값을 쓴다.
const PROJECT_LLM = { provider: 'openai', apiKey: 'sk-test-dummy', model: null };
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
  vi.mocked(findCaseSpec).mockResolvedValue(null);
  vi.mocked(getDecryptedApiKey).mockResolvedValue(PROJECT_LLM);
  vi.mocked(saveDraftSpec).mockResolvedValue();
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
        specSource: 'generated',
        specWarnings: [],
      },
    });
    expect(recordAutoResult).toHaveBeenCalledWith(
      expect.objectContaining({ runId: params.runId, caseKey: 'TC-001', status: 'pass' })
    );
    expect(runSpecOnRunner).toHaveBeenCalledOnce();
  });
});

describe('생성 spec 저장과 검증 (#187)', () => {
  const SNAPSHOT = ['- main:', '  - heading "대시보드" [level=1]'].join('\n');
  const GOOD = "await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();";
  const BAD = "await expect(page.getByRole('region', { name: '푸터 영역' })).toBeVisible();";

  beforeEach(() => {
    vi.mocked(captureSnapshot).mockResolvedValue({ ok: true, snapshot: SNAPSHOT });
  });

  it('승인된 spec 이 있으면 캡처·생성 없이 그 spec 을 실행한다.', async () => {
    vi.mocked(findCaseSpec).mockResolvedValue({
      spec: 'approved spec',
      status: 'approved',
      path: null,
      updatedAt: new Date(),
    });
    const result = await runAutomatedTest(params);
    expect(result.success && result.data.specSource).toBe('approved');
    expect(captureSnapshot).not.toHaveBeenCalled();
    expect(generateSpec).not.toHaveBeenCalled();
    expect(saveDraftSpec).not.toHaveBeenCalled();
    expect(runSpecOnRunner).toHaveBeenCalledWith(
      expect.objectContaining({ spec: 'approved spec' })
    );
  });

  it('초안만 있으면 새로 생성하고 초안을 갱신한다.', async () => {
    vi.mocked(findCaseSpec).mockResolvedValue({
      spec: 'old draft',
      status: 'draft',
      path: null,
      updatedAt: new Date(),
    });
    vi.mocked(generateSpec).mockResolvedValue(GOOD);
    await runAutomatedTest(params);
    expect(generateSpec).toHaveBeenCalledOnce();
    expect(saveDraftSpec).toHaveBeenCalledWith(expect.objectContaining({ spec: GOOD, path: null }));
  });

  it('트리에 없는 셀렉터를 쓰면 지적 사항을 넣어 한 번 재생성한다.', async () => {
    vi.mocked(generateSpec).mockResolvedValueOnce(BAD).mockResolvedValueOnce(GOOD);
    const result = await runAutomatedTest(params);
    expect(generateSpec).toHaveBeenCalledTimes(2);
    expect(vi.mocked(generateSpec).mock.calls[1][0].retry?.previousSpec).toBe(BAD);
    expect(runSpecOnRunner).toHaveBeenCalledWith(expect.objectContaining({ spec: GOOD }));
    expect(result.success && result.data.specWarnings).toEqual([]);
  });

  it('재생성해도 걸리면 실행은 하고 경고를 돌려준다.', async () => {
    vi.mocked(generateSpec).mockResolvedValue(BAD);
    const result = await runAutomatedTest(params);
    expect(generateSpec).toHaveBeenCalledTimes(2);
    expect(runSpecOnRunner).toHaveBeenCalledOnce();
    expect(result.success && result.data.specWarnings).toHaveLength(1);
  });

  it('실행이 실패해도 재생성하지 않는다.', async () => {
    vi.mocked(generateSpec).mockResolvedValue(GOOD);
    vi.mocked(runSpecOnRunner).mockResolvedValue({
      ok: false,
      status: 'failed',
      durationMs: 10,
      errorMessage: 'expect failed',
    });
    await runAutomatedTest(params);
    expect(generateSpec).toHaveBeenCalledOnce();
    expect(recordAutoResult).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
  });

  it('저장소 조회·저장이 실패해도 지금처럼 생성해서 실행한다.', async () => {
    vi.mocked(findCaseSpec).mockRejectedValue(new Error('relation does not exist'));
    vi.mocked(saveDraftSpec).mockRejectedValue(new Error('relation does not exist'));
    vi.mocked(generateSpec).mockResolvedValue(GOOD);
    const result = await runAutomatedTest(params);
    expect(result.success).toBe(true);
    expect(runSpecOnRunner).toHaveBeenCalledOnce();
  });
});

describe('AI 키는 프로젝트에 등록한 것만 쓴다', () => {
  it('생성할 때 프로젝트 AI 설정을 넘긴다.', async () => {
    await runAutomatedTest(params);
    expect(getDecryptedApiKey).toHaveBeenCalledWith(PROJECT_A);
    expect(vi.mocked(generateSpec).mock.calls[0][0].llm).toBe(PROJECT_LLM);
  });

  it('AI 설정이 없으면 캡처·생성·실행 전에 안내하고 멈춘다.', async () => {
    vi.mocked(getDecryptedApiKey).mockResolvedValue(null);
    const result = await runAutomatedTest(params);
    expect(result).toEqual({
      success: false,
      errors: {
        _general: ['AI 설정이 되어 있지 않습니다. 설정 페이지에서 API 키를 등록해주세요.'],
      },
    });
    expect(captureSnapshot).not.toHaveBeenCalled();
    expect(generateSpec).not.toHaveBeenCalled();
    expect(runSpecOnRunner).not.toHaveBeenCalled();
  });

  it('승인된 코드로 실행할 때는 AI 키가 없어도 된다.', async () => {
    vi.mocked(getDecryptedApiKey).mockResolvedValue(null);
    vi.mocked(findCaseSpec).mockResolvedValue({
      spec: 'approved spec',
      status: 'approved',
      path: null,
      updatedAt: new Date(),
    });
    const result = await runAutomatedTest(params);
    expect(result.success).toBe(true);
    expect(getDecryptedApiKey).not.toHaveBeenCalled();
  });

  it('제공자 오류는 사용자 안내 문구로 돌려준다.', async () => {
    const error = AiError.fromProviderResponse('openai', 401, '{}');
    vi.mocked(generateSpec).mockRejectedValue(error);
    const result = await runAutomatedTest(params);
    expect(result).toEqual({ success: false, errors: { _general: [error.userMessage] } });
    expect(runSpecOnRunner).not.toHaveBeenCalled();
  });
});
