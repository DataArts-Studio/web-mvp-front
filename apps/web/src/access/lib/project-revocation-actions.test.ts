import { changeProjectIdentifier, deleteProject } from '@/entities/project/api/server-actions';
import { getDatabase } from '@testea/db';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createProjectSessionToken } from './project-session';
import { requireProjectAccess } from './require-access';

vi.unmock('@/access/lib/require-access');
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({
  INVALIDATE: { project: [] },
  invalidateCache: vi.fn(),
}));
vi.mock('./password-hash', () => ({
  verifyPassword: vi.fn(async () => true),
  hashPassword: vi.fn(async () => 'synthetic-new-hash'),
}));
vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
const state = vi.hoisted(() => ({ token: '', deleteCookie: vi.fn() }));
vi.mock('./cookies', () => ({
  getAllAccessTokenCookies: async () => new Map([['project', state.token]]),
  deleteAccessTokenCookie: state.deleteCookie,
  // 비밀번호를 바꾼 브라우저의 쿠키가 새 세션으로 교체되는 것을 흉내 낸다.
  setAccessTokenCookie: async (_name: string, token: string) => {
    state.token = token;
  },
}));
const ID = '00000000-0000-4000-8000-000000000001';
let row = {
  id: ID,
  name: 'revocation-project',
  identifier: 'synthetic-old-hash',
  status: 'ACTIVE',
};
const write = vi.fn(async (patch: { identifier?: string; lifecycle_status?: string }) => {
  row = {
    ...row,
    identifier: patch.identifier ?? row.identifier,
    status: patch.lifecycle_status ?? row.status,
  };
});
const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({ where: vi.fn(() => ({ limit: async () => [row] })) })),
  })),
  update: vi.fn(() => ({
    set: (patch: { identifier?: string; lifecycle_status?: string }) => ({
      where: () => write(patch),
    }),
  })),
};
beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv('ACCESS_TOKEN_SECRET', 'synthetic-session-signing-key');
  row = { id: ID, name: 'revocation-project', identifier: 'synthetic-old-hash', status: 'ACTIVE' };
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  state.token = await createProjectSessionToken(ID, row.name, row.identifier);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

it('비밀번호 변경 후 이전 토큰은 거부하고, 변경한 브라우저는 새 세션으로 유지한다.', async () => {
  const oldToken = state.token;
  expect((await changeProjectIdentifier(ID, 'old-password', 'new-password')).success).toBe(true);
  expect(row.identifier).toBe('synthetic-new-hash');

  // 변경한 본인 브라우저: 새 해시로 재발급된 쿠키라 계속 접근된다.
  expect(state.token).not.toBe(oldToken);
  expect(await requireProjectAccess(ID)).toBe(true);

  // 다른 브라우저·복사해 둔 이전 쿠키: 폐기돼 조회·추가 변경 모두 거부된다.
  state.token = oldToken;
  expect(await requireProjectAccess(ID)).toBe(false);
  expect((await changeProjectIdentifier(ID, 'new-password', 'another-password')).success).toBe(
    false
  );
  expect(write).toHaveBeenCalledTimes(1);
});

it('실제 삭제 액션 후 복사해 둔 쿠키도 서버에서 거부한다.', async () => {
  expect((await deleteProject(ID, row.name)).success).toBe(true);
  expect(state.deleteCookie).toHaveBeenCalledWith(row.name);
  expect(row.status).toBe('DELETED');
  expect(await requireProjectAccess(ID)).toBe(false);
  expect((await deleteProject(ID, row.name)).success).toBe(false);
  expect(write).toHaveBeenCalledTimes(1);
});
