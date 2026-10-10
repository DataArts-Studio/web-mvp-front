import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminSession, revokeAdminSession } from '../lib/admin-session';
import { signInAdminAction } from './gate-actions';

const mocks = vi.hoisted(() => {
  // admin_activity_logs 의 login.failed 행을 흉내 내는 메모리 저장소 (IP 별 예약 id 목록).
  const rows = new Map<string, string[]>();
  let seq = 0;
  return {
    rows,
    // 재로그인 상황을 흉내 내는 현재 브라우저의 기존 세션 쿠키 값.
    existingSession: undefined as string | undefined,
    headers: new Map<string, string>(),
    cookieSet: vi.fn(),
    reserve: vi.fn(async (ip: string | null) => {
      const id = `r${++seq}`;
      const key = ip ?? '';
      rows.set(key, [...(rows.get(key) ?? []), id]);
      return id;
    }),
    count: vi.fn(async (ip: string | null) => (ip ? (rows.get(ip)?.length ?? 0) : 0)),
    release: vi.fn(async (id: string) => {
      for (const [k, ids] of rows)
        rows.set(
          k,
          ids.filter((x) => x !== id)
        );
    }),
    record: vi.fn(async () => {}),
    // 실제 redirect 는 예외로 흐름을 끊지만, 테스트에서는 호출만 기록한다. 예외 메시지에 기대면
    // 병렬 CI 에서 다른 거부값이 잡혀 간헐적으로 실패했다.
    redirect: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => mocks.headers.get(k.toLowerCase()) ?? null }),
  cookies: async () => ({
    set: mocks.cookieSet,
    get: (name: string) =>
      mocks.existingSession ? { name, value: mocks.existingSession } : undefined,
    delete: vi.fn(),
  }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('../lib/admin-session', () => ({
  ADMIN_SESSION_TTL_SECONDS: 28800,
  createAdminSession: vi.fn(async () => 'synthetic-session-token'),
  revokeAdminSession: vi.fn(async () => undefined),
  verifyAdminSession: vi.fn(async () => false),
}));
vi.mock('@/shared/db/cloudflare-db', () => ({ initCloudflareDb: vi.fn() }));
vi.mock('@testea/db', () => ({
  reserveFailedLogin: mocks.reserve,
  countRecentFailedLogins: mocks.count,
  releaseFailedLogin: mocks.release,
  recordAdminActivity: mocks.record,
}));

const IP = '203.0.113.7';

function form(secret: string): FormData {
  const f = new FormData();
  f.set('secret', secret);
  return f;
}

describe('signInAdminAction 브루트포스 방어', () => {
  beforeEach(() => {
    vi.stubEnv('BACKOFFICE_ADMIN_SECRET', 'correct-key');
    mocks.rows.clear();
    mocks.existingSession = undefined;
    mocks.headers.clear();
    mocks.headers.set('cf-connecting-ip', IP);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('틀린 키는 실패 기록을 남기고 거부한다', async () => {
    const result = await signInAdminAction({}, form('wrong'));
    expect(result).toEqual({ error: '키가 올바르지 않습니다.' });
    expect(mocks.rows.get(IP)).toHaveLength(1);
  });

  it('5회 실패 뒤 6번째는 맞는 키여도 잠근다', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(await signInAdminAction({}, form('wrong'))).toEqual({
        error: '키가 올바르지 않습니다.',
      });
    }
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/시도가 너무 많습니다/);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('동시에 몰려온 시도도 임계치 이하로만 키 검증에 도달한다', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => signInAdminAction({}, form('wrong')))
    );
    const reachedCheck = results.filter((r) => r.error === '키가 올바르지 않습니다.').length;
    expect(reachedCheck).toBeLessThanOrEqual(5);
  });

  it('락아웃 키는 위조 가능한 x-forwarded-for 가 아니라 cf-connecting-ip 를 쓴다', async () => {
    mocks.headers.set('x-forwarded-for', '198.51.100.1');
    await signInAdminAction({}, form('wrong'));
    expect(mocks.reserve).toHaveBeenCalledWith(IP);
    expect(mocks.count).toHaveBeenCalledWith(IP, 15);
  });

  it('시도 기록이 실패하면 키를 확인하지 않고 거부한다 (fail-closed)', async () => {
    mocks.reserve.mockRejectedValueOnce(new Error('db down'));
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/로그인을 처리할 수 없습니다/);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('맞는 키면 예약한 실패 기록을 지우고 세션 쿠키를 발급한다', async () => {
    let thrown: unknown;
    await signInAdminAction({}, form('correct-key')).catch((error: unknown) => {
      thrown = error;
    });
    // 실패 시 실제 거부값을 드러낸다(간헐 실패 추적용).
    expect(thrown).toBeUndefined();
    expect(mocks.redirect).toHaveBeenCalledWith('/notices');
    expect(mocks.rows.get(IP)).toHaveLength(0);
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'bo_admin_session',
      'synthetic-session-token',
      expect.objectContaining({ httpOnly: true })
    );
  });
});

describe('signInAdminAction 재로그인 세션 교체', () => {
  beforeEach(() => {
    vi.stubEnv('BACKOFFICE_ADMIN_SECRET', 'correct-key');
    mocks.rows.clear();
    mocks.existingSession = 'previous-session-token';
    mocks.headers.clear();
    mocks.headers.set('cf-connecting-ip', IP);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('새 세션을 만든 뒤 기존 세션을 폐기한다', async () => {
    await signInAdminAction({}, form('correct-key'));
    expect(revokeAdminSession).toHaveBeenCalledWith('previous-session-token');
    const created = vi.mocked(createAdminSession).mock.invocationCallOrder[0];
    const revoked = vi.mocked(revokeAdminSession).mock.invocationCallOrder[0];
    expect(created).toBeLessThan(revoked);
  });

  it('새 세션 생성이 실패하면 기존 세션을 지우지 않는다', async () => {
    vi.mocked(createAdminSession).mockRejectedValueOnce(new Error('db down'));
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/로그인을 처리할 수 없습니다/);
    expect(revokeAdminSession).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('기존 세션 폐기가 실패하면 새 세션도 정리하고 쿠키를 발급하지 않는다', async () => {
    vi.mocked(revokeAdminSession).mockRejectedValueOnce(new Error('db down'));
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/로그인을 처리할 수 없습니다/);
    expect(revokeAdminSession).toHaveBeenLastCalledWith('synthetic-session-token');
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});
