// @vitest-environment node
import { requireProjectAccess } from '@/access/lib/require-access';
import { callLlm } from '@/entities/ai-config/api/call-llm';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { AiError } from '@/entities/ai-config/model/ai-error';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshShareSummary } from './share-actions';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@/entities/ai-config/api/call-llm', () => ({ callLlm: vi.fn() }));
vi.mock('@/entities/ai-config/api/decrypt-api-key', () => ({ getDecryptedApiKey: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const RUN_ID = '00000000-0000-4000-8000-000000000001';
const PROJECT_ID = '00000000-0000-4000-8000-000000000002';
// 프로젝트에 등록한 AI 설정. 누가 봐도 가짜인 값을 쓴다.
const PROJECT_LLM = { provider: 'anthropic', apiKey: 'sk-ant-test-dummy', model: null };

/** drizzle 쿼리 빌더 흉내. 어느 메서드를 이어 불러도 마지막에 result 로 풀린다. */
function query(result: unknown) {
  const builder: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'limit', 'innerJoin', 'set', 'values', 'returning']) {
    builder[method] = () => builder;
  }
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const shareableRun = {
  id: RUN_ID,
  projectId: PROJECT_ID,
  name: '회귀 실행',
  lifecycleStatus: 'ACTIVE',
  shareToken: 'share-token',
  shareExpiresAt: new Date(Date.now() + 86_400_000),
  shareAiSummary: null,
};

const set = vi.fn();
const db = {
  // 실행 조회 → 프로젝트 이름 → 케이스 결과(비어 있으면 스위트 조회 없음)
  select: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  db.select
    .mockReturnValueOnce(query([shareableRun]))
    .mockReturnValueOnce(query([{ name: '샘플 프로젝트' }]))
    .mockReturnValue(query([]));
  db.update.mockImplementation(() => ({
    set: (values: unknown) => (set(values), query([{ id: RUN_ID }])),
  }));
  db.transaction.mockImplementation(async (work: (tx: unknown) => unknown) =>
    work({
      execute: vi.fn(),
      select: () => query([{ count: 0 }]),
      insert: () => query(undefined),
    })
  );
});

describe('공유 리포트 AI 요약은 프로젝트에 등록한 키로만 만든다', () => {
  it('등록한 AI 설정으로 요약을 만들어 저장한다.', async () => {
    vi.mocked(getDecryptedApiKey).mockResolvedValue(PROJECT_LLM);
    vi.mocked(callLlm).mockResolvedValue(' 통과율 0%. 실행 전 케이스가 없다. ');

    const result = await refreshShareSummary(RUN_ID);

    expect(result).toEqual({ success: true, data: { hasSummary: true, aiConfigured: true } });
    expect(getDecryptedApiKey).toHaveBeenCalledWith(PROJECT_ID);
    expect(vi.mocked(callLlm).mock.calls[0][0]).toBe(PROJECT_LLM);
    const saved = JSON.parse(set.mock.calls[0][0].share_ai_summary);
    expect(saved.text).toBe('통과율 0%. 실행 전 케이스가 없다.');
  });

  it('AI 설정이 없으면 생성하지 않고 한도도 쓰지 않는다.', async () => {
    vi.mocked(getDecryptedApiKey).mockResolvedValue(null);

    const result = await refreshShareSummary(RUN_ID);

    expect(result).toEqual({ success: true, data: { hasSummary: false, aiConfigured: false } });
    expect(callLlm).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ share_ai_summary: null });
  });

  it('제공자 오류는 요약 없음으로 처리한다.', async () => {
    vi.mocked(getDecryptedApiKey).mockResolvedValue(PROJECT_LLM);
    vi.mocked(callLlm).mockRejectedValue(
      AiError.fromProviderResponse('anthropic', 401, 'unauthorized')
    );

    const result = await refreshShareSummary(RUN_ID);

    expect(result).toEqual({ success: true, data: { hasSummary: false, aiConfigured: true } });
  });

  it('키 복호화 실패도 요약 없음으로 처리한다.', async () => {
    vi.mocked(getDecryptedApiKey).mockRejectedValue(new Error('decrypt failed'));

    const result = await refreshShareSummary(RUN_ID);

    expect(result).toEqual({ success: true, data: { hasSummary: false, aiConfigured: true } });
    expect(callLlm).not.toHaveBeenCalled();
  });
});
