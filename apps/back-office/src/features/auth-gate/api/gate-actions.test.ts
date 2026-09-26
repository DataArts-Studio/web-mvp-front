import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signInAdminAction } from './gate-actions';

const mocks = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookieSet: vi.fn(),
  ipFailures: vi.fn(async () => 0),
  globalFailures: vi.fn(async () => 0),
  record: vi.fn(async () => {}),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => mocks.headers.get(k.toLowerCase()) ?? null }),
  cookies: async () => ({ set: mocks.cookieSet, get: () => undefined, delete: vi.fn() }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/shared/db/cloudflare-db', () => ({ initCloudflareDb: vi.fn() }));
vi.mock('@testea/db', () => ({
  countRecentFailedLogins: mocks.ipFailures,
  countRecentFailedLoginsGlobal: mocks.globalFailures,
  recordAdminActivity: mocks.record,
}));

function form(secret: string): FormData {
  const f = new FormData();
  f.set('secret', secret);
  return f;
}

describe('signInAdminAction 브루트포스 방어', () => {
  beforeEach(() => {
    vi.stubEnv('BACKOFFICE_ADMIN_SECRET', 'correct-key');
    mocks.headers.clear();
    mocks.headers.set('cf-connecting-ip', '203.0.113.7');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('틀린 키는 실패로 기록하고 거부한다', async () => {
    const result = await signInAdminAction({}, form('wrong'));
    expect(result).toEqual({ error: '키가 올바르지 않습니다.' });
    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login.failed', ip: '203.0.113.7' })
    );
  });

  it('IP 실패가 임계치 이상이면 맞는 키도 검증하지 않고 잠근다', async () => {
    mocks.ipFailures.mockResolvedValueOnce(5);
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/시도가 너무 많습니다/);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('전역 실패가 임계치 이상이면 IP 가 달라도 잠근다', async () => {
    mocks.globalFailures.mockResolvedValueOnce(50);
    const result = await signInAdminAction({}, form('correct-key'));
    expect(result.error).toMatch(/시도가 너무 많습니다/);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('락아웃 키는 위조 가능한 x-forwarded-for 가 아니라 cf-connecting-ip 를 쓴다', async () => {
    mocks.headers.set('x-forwarded-for', '198.51.100.1');
    await signInAdminAction({}, form('wrong'));
    expect(mocks.ipFailures).toHaveBeenCalledWith('203.0.113.7', 15);
  });

  it('맞는 키면 세션 쿠키를 발급하고 이동한다', async () => {
    await expect(signInAdminAction({}, form('correct-key'))).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'bo_admin_session',
      'correct-key',
      expect.objectContaining({ httpOnly: true })
    );
  });
});
