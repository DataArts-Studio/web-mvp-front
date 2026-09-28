import { getDatabase, projects } from '@testea/db';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { setAccessTokenCookie } from '../../lib/cookies';
import { verifyPassword } from '../../lib/password-hash';
import { createProjectSessionToken } from '../../lib/project-session';
import { verifyProjectAccess } from './verify-access';

vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/turnstile', () => ({ verifyTurnstileToken: vi.fn(async () => true) }));
vi.mock('../../lib/cookies', () => ({
  setAccessTokenCookie: vi.fn(),
  deleteAccessTokenCookie: vi.fn(),
}));
vi.mock('../../lib/password-hash', () => ({ verifyPassword: vi.fn(async () => true) }));
vi.mock('../../lib/project-session', () => ({
  createProjectSessionToken: vi.fn(async () => 'synthetic-token'),
}));
const limit = vi.fn();
const where = vi.fn((_condition: SQL) => ({ limit }));
const select = vi.fn(() => ({ from: () => ({ where }) }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.mocked(getDatabase).mockReturnValue({ select } as never);
});
afterEach(() => vi.unstubAllEnvs());
it.each(['ARCHIVED', 'DELETED'])(
  '비활성 %s 프로젝트는 세션과 쿠키를 발급하지 않는다.',
  async (lifecycleStatus) => {
    limit.mockResolvedValue([
      { id: 'id', name: lifecycleStatus, identifier: 'synthetic-hash', lifecycleStatus },
    ]);
    expect((await verifyProjectAccess(lifecycleStatus, 'password1')).success).toBe(false);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(createProjectSessionToken).not.toHaveBeenCalled();
    expect(setAccessTokenCookie).not.toHaveBeenCalled();
  }
);
it.each(['%', '%41', '한글 프로젝트'])(
  '활성 프로젝트 %s의 원래 이름으로 로그인하고 경로를 인코딩한다.',
  async (name) => {
    limit.mockResolvedValue([
      { id: 'id', name, identifier: 'synthetic-hash', lifecycleStatus: 'ACTIVE' },
    ]);
    expect(await verifyProjectAccess(name, 'password1')).toEqual({
      success: true,
      redirectUrl: `/projects/${encodeURIComponent(name)}`,
    });
    expect(new PgDialect().sqlToQuery(where.mock.calls[0][0]).params).toContain(name);
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ lifecycleStatus: projects.lifecycle_status })
    );
    expect(createProjectSessionToken).toHaveBeenCalledWith('id', name, 'synthetic-hash');
    expect(setAccessTokenCookie).toHaveBeenCalledWith(name, 'synthetic-token');
  }
);
