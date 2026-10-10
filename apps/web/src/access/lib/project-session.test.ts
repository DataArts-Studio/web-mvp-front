import { updateTestRunName } from '@/features/runs/api/update-test-run-name';
import { getDatabase } from '@testea/db';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { canAccessProject, getValidAccessToken } from '../policy/access-policy';
import {
  createProjectAccessToken,
  parseTokenPayload,
  verifyProjectAccessToken,
} from './access-token';
import { createProjectSessionToken, verifyProjectSessionToken } from './project-session';
import { requireProjectAccess } from './require-access';

vi.unmock('@/access/lib/require-access');
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: { runs: [] }, invalidateCache: vi.fn() }));
vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
const state = vi.hoisted(() => ({ token: '' }));
vi.mock('./cookies', () => ({
  getAllAccessTokenCookies: async () => new Map([['project', state.token]]),
  getAccessTokenCookie: async () => state.token,
}));
const ID = '00000000-0000-4000-8000-000000000001';
const NAME = 'session-project';
const limit = vi.fn();
const update = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(async () => [{ id: 'run', name: '변경' }]),
    })),
  })),
}));
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  update,
};

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-28T00:00:00Z'));
  vi.stubEnv('ACCESS_TOKEN_SECRET', 'synthetic-signing-key');
  limit.mockReset().mockResolvedValue([{ identifier: 'synthetic-bcrypt-v1', status: 'ACTIVE' }]);
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  state.token = await createProjectSessionToken(ID, NAME, 'synthetic-bcrypt-v1');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('프로젝트 세션 폐기', () => {
  it('정상 세션은 액션 가드와 페이지 정책에서 허용한다.', async () => {
    expect(await requireProjectAccess(ID)).toBe(true);
    expect(await canAccessProject(NAME)).toBe(true);
    expect((await getValidAccessToken(NAME))?.projectId).toBe(ID);
    expect(JSON.stringify(parseTokenPayload(state.token))).not.toContain('synthetic-bcrypt');
  });
  it('비밀번호가 바뀌면 기존 토큰은 거부하고 새 인증으로 발급한 토큰만 허용한다.', async () => {
    limit.mockResolvedValue([{ identifier: 'synthetic-bcrypt-v2', status: 'ACTIVE' }]);
    expect(await requireProjectAccess(ID)).toBe(false);
    expect(await canAccessProject(NAME)).toBe(false);
    expect(await getValidAccessToken(NAME)).toBeNull();
    state.token = await createProjectSessionToken(ID, NAME, 'synthetic-bcrypt-v2');
    expect(await requireProjectAccess(ID)).toBe(true);
  });
  it.each(['DELETED', 'ARCHIVED'])(
    '%s 프로젝트는 이전 토큰으로 접근할 수 없다.',
    async (status) => {
      limit.mockResolvedValue([{ identifier: 'synthetic-bcrypt-v1', status }]);
      expect(await requireProjectAccess(ID)).toBe(false);
      expect(await canAccessProject(NAME)).toBe(false);
    }
  );
  it('프로젝트가 없거나 DB 조회가 실패하면 거부한다.', async () => {
    limit.mockResolvedValueOnce([]);
    expect((await verifyProjectSessionToken(state.token)).valid).toBe(false);
    limit.mockRejectedValueOnce(new Error('database unavailable'));
    expect(await requireProjectAccess(ID)).toBe(false);
  });
  it('버전 정보가 없는 기존 토큰은 재인증을 요구한다.', async () => {
    state.token = await createProjectAccessToken(ID, NAME);
    expect(await requireProjectAccess(ID)).toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });
  it('만료 시각과 정확히 같아도 거부하며 DB를 조회하지 않는다.', async () => {
    vi.setSystemTime(new Date('2026-09-29T00:00:00Z'));
    expect(await verifyProjectSessionToken(state.token)).toEqual({
      valid: false,
      error: 'TOKEN_EXPIRED',
    });
    expect(db.select).not.toHaveBeenCalled();
  });
  it('위조 서명과 다른 프로젝트 요청을 거부한다.', async () => {
    expect(await requireProjectAccess('00000000-0000-4000-8000-000000000002')).toBe(false);
    state.token += 'tampered';
    expect(await requireProjectAccess(ID)).toBe(false);
  });
  it('폐기된 세션으로 실행 변경을 요청해도 DB 쓰기가 발생하지 않는다.', async () => {
    limit
      .mockResolvedValueOnce([{ projectId: ID }])
      .mockResolvedValueOnce([{ identifier: 'synthetic-bcrypt-v2', status: 'ACTIVE' }]);
    expect((await updateTestRunName('run', '변경')).success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
  it('유효한 세션의 기존 실행 변경은 유지한다.', async () => {
    limit.mockResolvedValueOnce([{ projectId: ID }]);
    expect((await updateTestRunName('run', '변경')).success).toBe(true);
    expect(update).toHaveBeenCalled();
  });
  it.each([undefined, null, 'tomorrow'])(
    '서명돼 있어도 잘못된 만료값 %j을 거부한다.',
    async (expiresAt) => {
      const [header] = state.token.split('.');
      const payload = Buffer.from(
        JSON.stringify({ ...parseTokenPayload(state.token), expiresAt })
      ).toString('base64url');
      const signature = createHmac('sha256', 'synthetic-signing-key')
        .update(header + '.' + payload)
        .digest('base64url');
      expect((await verifyProjectAccessToken(header + '.' + payload + '.' + signature)).valid).toBe(
        false
      );
    }
  );
});
