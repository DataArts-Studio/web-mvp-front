import {
  createMockProjectRow,
  mockDb,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateProject } from './server-actions';

const session = vi.hoisted(() => ({
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  createToken: vi.fn(async () => 'new-token'),
  redirect: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: session.redirect }));

vi.mock('@testea/db', () => ({
  getDatabase: mockGetDatabase,
  projects: { id: 'id', name: 'name' },
}));

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: async () => true }));
vi.mock('@/access/lib/cookies', () => ({
  setAccessTokenCookie: session.setCookie,
  deleteAccessTokenCookie: session.deleteCookie,
}));
vi.mock('@/access/lib/project-session', () => ({
  createProjectSessionToken: session.createToken,
}));

/** update().set() 에 넘어간 값을 꺼낸다. */
const lastSetData = () => {
  const update = mockDb.update.mock.results.at(-1)?.value;
  return update?.set.mock.calls.at(-1)?.[0];
};

describe('updateProject', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('이름의 앞뒤 공백을 지우고 연속 공백을 하나로 줄여 저장한다', async () => {
    setMockSelectReturn([{ name: 'Old Project' }]);
    setMockUpdateReturn(createMockProjectRow({ id: 'p1' }));

    const result = await updateProject('p1', { name: '  Test   Project  ' });

    expect(result.success).toBe(true);
    expect(lastSetData()).toEqual(expect.objectContaining({ name: 'Test Project' }));
  });

  it('공백만 있는 이름은 저장하지 않고 거부한다', async () => {
    setMockSelectReturn([{ name: 'Old Project' }]);
    const result = await updateProject('p1', { name: '   ' });

    expect(result.success).toBe(false);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('이름이 바뀌면 새 이름으로 세션을 다시 발급하고 옛 쿠키를 지운다', async () => {
    setMockSelectReturn([{ name: 'Old Project' }]);
    setMockUpdateReturn(
      createMockProjectRow({ id: 'p1', name: 'New Project', identifier: 'hash' })
    );

    const result = await updateProject('p1', { name: 'New Project' });

    expect(result).toEqual(expect.objectContaining({ success: true }));
    if (result.success) expect(result.data.name).toBe('New Project');
    expect(session.createToken).toHaveBeenCalledWith('p1', 'New Project', 'hash');
    expect(session.setCookie).toHaveBeenCalledWith('New Project', 'new-token');
    expect(session.deleteCookie).toHaveBeenCalledWith('Old Project');
    expect(session.redirect).toHaveBeenCalledWith(
      `/projects/${encodeURIComponent('New Project')}/settings?renamed=1`
    );
  });

  it('이름이 그대로면 세션을 다시 발급하지 않는다', async () => {
    setMockSelectReturn([{ name: 'Same' }]);
    setMockUpdateReturn(createMockProjectRow({ id: 'p1', name: 'Same' }));

    await updateProject('p1', { description: '설명' });

    expect(session.setCookie).not.toHaveBeenCalled();
    expect(session.deleteCookie).not.toHaveBeenCalled();
    expect(session.redirect).not.toHaveBeenCalled();
  });

  it('다른 프로젝트가 쓰는 이름으로 바꾸면 이름 중복 오류를 돌려준다', async () => {
    setMockSelectReturn([{ name: 'Old Project' }]);
    mockDb.update.mockImplementationOnce(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.reject(new Error('Failed query', { cause: { code: '23505' } }))
          ),
        })),
      })),
    }));

    const result = await updateProject('p1', { name: 'Taken' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.name?.[0]).toContain('이미 사용 중인 프로젝트 이름');
    expect(session.setCookie).not.toHaveBeenCalled();
  });
});
