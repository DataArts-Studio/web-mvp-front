import { logAdminActivity } from '@/features/admin-log/log';
import {
  createAnnouncement,
  deleteAnnouncement,
  getDatabase,
  setAnnouncementActive,
  updateAnnouncement,
} from '@testea/db';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createNoticeAction,
  deleteNoticeAction,
  toggleNoticeAction,
  updateNoticeAction,
} from '../../notices/api/actions';
import { signInAdminAction, signOutAdminAction } from '../api/gate-actions';
import { assertAdminAction, isAdminAuthed, requireAdmin } from './admin-gate';
import { createAdminSession, revokeAdminSession, verifyAdminSession } from './admin-session';

vi.mock('server-only', () => ({}));
vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
  createAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  updateAnnouncement: vi.fn(),
  setAnnouncementActive: vi.fn(),
  reserveFailedLogin: vi.fn(async () => 'reservation'),
  countRecentFailedLogins: vi.fn(async () => 1),
  releaseFailedLogin: vi.fn(async () => undefined),
}));
vi.mock('@/features/admin-log/log', () => ({
  getClientIp: async () => null,
  logAdminActivity: vi.fn(),
}));
vi.mock('@/shared/db/cloudflare-db', () => ({ initCloudflareDb: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const cookiesMock = vi.hoisted(() => ({
  token: undefined as string | undefined,
  set: vi.fn(),
  delete: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (cookiesMock.token ? { value: cookiesMock.token } : undefined),
    set: cookiesMock.set,
    delete: cookiesMock.delete,
  }),
}));
vi.mock('next/navigation', () => ({ redirect: cookiesMock.redirect }));

type StoredSession = { token_hash: string; secret_version: string; expires_at: Date };
const rows = new Map<string, StoredSession>();
const dialect = new PgDialect();
const params = (condition: SQL) => dialect.sqlToQuery(condition).params;
const insert = vi.fn(() => ({
  values: vi.fn(async (row: StoredSession) => {
    rows.set(row.token_hash, row);
  }),
}));
const where = vi.fn((condition: SQL) => ({
  limit: vi.fn(async () => {
    const row = rows.get(params(condition)[0] as string);
    return row
      ? [
          {
            tokenHash: row.token_hash,
            secretVersion: row.secret_version,
            expiresAt: row.expires_at,
          },
        ]
      : [];
  }),
}));
const remove = vi.fn(async (condition: SQL) => {
  rows.delete(params(condition)[0] as string);
});
const db = {
  insert,
  select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
  delete: vi.fn(() => ({ where: remove })),
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-28T00:00:00Z'));
  vi.stubEnv('BACKOFFICE_ADMIN_SECRET', 'synthetic-admin-secret');
  rows.clear();
  cookiesMock.token = undefined;
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('관리자 세션 만료와 폐기', () => {
  it('쿠키는 난수이고 DB에는 원문 대신 해시와 만료만 저장한다.', async () => {
    const token = await createAdminSession();
    const row = [...rows.values()][0];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(row.token_hash).not.toBe(token);
    expect(JSON.stringify(row)).not.toContain('synthetic-admin-secret');
    expect(row.expires_at.toISOString()).toBe('2026-09-28T08:00:00.000Z');
    expect(await verifyAdminSession(token)).toBe(true);
    const query = dialect.sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"expires_at" >');
    expect(query.sql).toContain('"secret_version" =');
  });
  it('만료 직전은 허용하고 정확히 만료되는 시각부터 수동 재전송을 거부한다.', async () => {
    const token = await createAdminSession();
    vi.setSystemTime(new Date('2026-09-28T07:59:59.999Z'));
    expect(await verifyAdminSession(token)).toBe(true);
    vi.setSystemTime(new Date('2026-09-28T08:00:00Z'));
    expect(await verifyAdminSession(token)).toBe(false);
  });
  it('로그아웃한 세션만 폐기하고 다른 세션은 유지한다.', async () => {
    const first = await createAdminSession();
    const second = await createAdminSession();
    cookiesMock.token = first;
    await signOutAdminAction();
    expect(await verifyAdminSession(first)).toBe(false);
    expect(await verifyAdminSession(second)).toBe(true);
    expect(cookiesMock.delete).toHaveBeenCalledWith('bo_admin_session');
    expect(cookiesMock.redirect).toHaveBeenCalledWith('/notices/gate');
  });
  it('유효한 세션의 로그아웃은 활동 로그에 남긴다.', async () => {
    cookiesMock.token = await createAdminSession();
    await signOutAdminAction();
    expect(vi.mocked(logAdminActivity)).toHaveBeenCalledWith({ action: 'logout' });
  });
  it('세션 없는 로그아웃 호출은 로그에 남기지 않고 게이트로만 보낸다.', async () => {
    cookiesMock.token = undefined;
    await signOutAdminAction();
    expect(vi.mocked(logAdminActivity)).not.toHaveBeenCalledWith({ action: 'logout' });
    expect(cookiesMock.redirect).toHaveBeenCalledWith('/notices/gate');
  });
  it('공유키 변경·미설정·위조 쿠키와 이전 원문 키 쿠키를 거부한다.', async () => {
    const token = await createAdminSession();
    expect(await verifyAdminSession('f'.repeat(64))).toBe(false);
    expect(await verifyAdminSession('synthetic-admin-secret')).toBe(false);
    vi.stubEnv('BACKOFFICE_ADMIN_SECRET', 'rotated-synthetic-secret');
    expect(await verifyAdminSession(token)).toBe(false);
    vi.stubEnv('BACKOFFICE_ADMIN_SECRET', '');
    expect(await verifyAdminSession(token)).toBe(false);
  });
  it('DB 조회 실패 시 관리자 권한을 부여하지 않는다.', async () => {
    const token = await createAdminSession();
    db.select.mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });
    expect(await verifyAdminSession(token)).toBe(false);
  });
  it('로그아웃 DB 삭제 실패를 성공으로 표시하거나 쿠키만 지우지 않는다.', async () => {
    cookiesMock.token = await createAdminSession();
    remove.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(signOutAdminAction()).rejects.toThrow('database unavailable');
    expect(cookiesMock.delete).not.toHaveBeenCalled();
    expect(cookiesMock.redirect).not.toHaveBeenCalled();
  });
  it('로그인 저장 실패 시 쿠키나 성공 리다이렉트를 발급하지 않는다.', async () => {
    insert.mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });
    const form = new FormData();
    form.set('secret', 'synthetic-admin-secret');
    expect(await signInAdminAction({}, form)).toEqual({
      error: expect.stringContaining('로그인을 처리할 수 없습니다'),
    });
    expect(cookiesMock.set).not.toHaveBeenCalled();
    expect(cookiesMock.redirect).not.toHaveBeenCalled();
  });
  it('재로그인은 이전 세션을 폐기하고 원문 공유키가 아닌 새 세션을 발급한다.', async () => {
    const old = await createAdminSession();
    cookiesMock.token = old;
    const form = new FormData();
    form.set('secret', 'synthetic-admin-secret');
    await signInAdminAction({}, form);
    const token = cookiesMock.set.mock.calls[0][1] as string;
    expect(token).not.toBe(old);
    expect(token).not.toBe('synthetic-admin-secret');
    expect(await verifyAdminSession(old)).toBe(false);
    expect(await verifyAdminSession(token)).toBe(true);
  });
  it('만료된 쿠키는 페이지와 공지 변경 액션 모두에서 거부한다.', async () => {
    cookiesMock.token = await createAdminSession();
    vi.setSystemTime(new Date('2026-09-28T08:00:00Z'));
    expect(await isAdminAuthed()).toBe(false);
    await requireAdmin();
    expect(cookiesMock.redirect).toHaveBeenCalledWith('/notices/gate?redirect=%2Fnotices');
    await expect(assertAdminAction()).rejects.toThrow('UNAUTHORIZED');
    await expect(createNoticeAction({}, new FormData())).rejects.toThrow('UNAUTHORIZED');
    await expect(updateNoticeAction('notice', {}, new FormData())).rejects.toThrow('UNAUTHORIZED');
    await expect(deleteNoticeAction('notice')).rejects.toThrow('UNAUTHORIZED');
    await expect(toggleNoticeAction('notice', false)).rejects.toThrow('UNAUTHORIZED');
    for (const mutation of [
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      setAnnouncementActive,
    ]) {
      expect(mutation).not.toHaveBeenCalled();
    }
  });
  it('정상 세션은 페이지와 공지 변경 가드를 통과한다.', async () => {
    cookiesMock.token = await createAdminSession();
    expect(await isAdminAuthed()).toBe(true);
    await requireAdmin();
    expect(cookiesMock.redirect).not.toHaveBeenCalled();
    await deleteNoticeAction('notice');
    expect(deleteAnnouncement).toHaveBeenCalledWith('notice');
  });
});
