import { getDatabase } from '@testea/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { consumeRateLimit, getClientIp, isPublicActionLimited } from './index';

vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-real-ip': '203.0.113.7' }),
}));

const returning = vi.fn();
const values = vi.fn((_row: { key: string }) => ({
  onConflictDoUpdate: () => ({ returning }),
}));
const db = { insert: vi.fn(() => ({ values })), delete: vi.fn(() => ({ where: vi.fn() })) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  vi.mocked(getDatabase).mockReturnValue(db as never);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('consumeRateLimit', () => {
  it('DB 가 돌려준 횟수가 한도 이하면 허용하고, 넘으면 막는다.', async () => {
    returning.mockResolvedValueOnce([{ count: 5, retryAfterMs: 1000 }]);
    expect(await consumeRateLimit('k', { limit: 5, windowMs: 60_000 })).toEqual({
      count: 5,
      allowed: true,
      retryAfterMs: 1000,
    });

    returning.mockResolvedValueOnce([{ count: 6, retryAfterMs: 900 }]);
    expect((await consumeRateLimit('k', { limit: 5, windowMs: 60_000 })).allowed).toBe(false);
  });
});

describe('isPublicActionLimited', () => {
  it('운영이 아니면 DB 를 건드리지 않고 통과시킨다.', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(await isPublicActionLimited('search', { limit: 1, windowMs: 1000 })).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('운영에서는 액션과 IP 별로 세고 한도를 넘으면 막는다.', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    returning.mockResolvedValueOnce([{ count: 2, retryAfterMs: 500 }]);
    expect(await isPublicActionLimited('search', { limit: 1, windowMs: 1000 })).toBe(true);
    expect(values.mock.calls[0][0].key).toBe('public:search:ip:203.0.113.7');
  });
});

describe('getClientIp', () => {
  it('조작 가능한 XFF 좌측 대신 x-real-ip, 없으면 XFF 우측을 쓴다.', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe(
      '1.1.1.1'
    );
    expect(getClientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 2.2.2.2' }))).toBe('2.2.2.2');
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
