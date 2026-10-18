import { requireProjectAccess } from '@/access/lib/require-access';
import { githubApi } from '@/entities/github-connection/lib/github-api';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRunIssue } from './create-run-issue';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/crypto', () => ({ decrypt: vi.fn(() => 'test-dummy-token') }));
vi.mock('@/entities/github-connection/lib/github-api', () => ({ githubApi: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const RUN_ID = '00000000-0000-4000-8000-000000000003';
const CASE_RUN_1 = '00000000-0000-4000-8000-000000000005';
const CASE_RUN_2 = '00000000-0000-4000-8000-000000000006';

// select 결과를 호출 순서대로 돌려준다: 실행(접근 확인) → 실행 → 케이스 실행 → GitHub 연결
let selectResults: unknown[][] = [];
const chain = () => {
  const result = selectResults.shift() ?? [];
  const thenable = {
    limit: vi.fn(async () => result),
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  };
  return { from: vi.fn(() => ({ where: vi.fn(() => thenable) })) };
};
const values = vi.fn(async () => undefined);
const db = {
  select: vi.fn(() => chain()),
  insert: vi.fn(() => ({ values })),
};

const input = {
  testRunId: RUN_ID,
  testCaseRunIds: [CASE_RUN_1, CASE_RUN_2],
  title: '[인증] 잠금 실패',
  body: '본문',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  selectResults = [
    [{ projectId: PROJECT_A }],
    [{ projectId: PROJECT_A }],
    [{ testCaseId: 'case-1' }, { testCaseId: 'case-2' }],
    [{ repoFullName: 'acme/web', token: 'encrypted' }],
  ];
  vi.mocked(githubApi).mockResolvedValue({
    number: 12,
    html_url: 'https://github.com/acme/web/issues/12',
    title: '[인증] 잠금 실패',
    state: 'open',
  });
});

describe('createRunIssue', () => {
  it('권한이 없으면 이슈를 만들지 않는다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect((await createRunIssue(input)).success).toBe(false);
    expect(githubApi).not.toHaveBeenCalled();
  });

  it('다른 실행의 결과 ID 가 섞이면 만들지 않는다.', async () => {
    selectResults[2] = [{ testCaseId: 'case-1' }];
    expect((await createRunIssue(input)).success).toBe(false);
    expect(githubApi).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('저장소를 고르지 않았으면 만들지 않는다.', async () => {
    selectResults[3] = [{ repoFullName: null, token: 'encrypted' }];
    expect((await createRunIssue(input)).success).toBe(false);
    expect(githubApi).not.toHaveBeenCalled();
  });

  it('이슈를 만들고 고른 케이스마다 링크를 남긴다.', async () => {
    expect(await createRunIssue(input)).toEqual({
      success: true,
      data: { issueUrl: 'https://github.com/acme/web/issues/12', number: 12 },
    });
    expect(githubApi).toHaveBeenCalledWith(
      'test-dummy-token',
      '/repos/acme/web/issues',
      expect.objectContaining({ method: 'POST' })
    );
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ test_case_id: 'case-1', external_id: '12' }),
      expect.objectContaining({ test_case_id: 'case-2', external_id: '12' }),
    ]);
  });
});
