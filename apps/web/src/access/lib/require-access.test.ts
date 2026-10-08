import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectAccessTokenPayload } from '../policy/types';
import { requireProjectAccess } from './require-access';

// vi.hoisted 로 mock 함수를 끌어올려 factory 와 테스트가 같은 인스턴스를 공유하게 한다.
const { mockCookies, mockBasic, mockVerify } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  /** 서명·만료만 보는 1차 검증 (DB 없음) */
  mockBasic: vi.fn(),
  /** DB 로 폐기 여부까지 보는 세션 검증 */
  mockVerify: vi.fn(),
}));

// setup-tests.ts 가 require-access 를 전역 mock(항상 true)으로 덮으므로, 이 파일에서는
// 실제 구현을 검증하기 위해 unmock 한 뒤 그 의존(cookies·access-token·project-session)만 모킹한다.
vi.unmock('@/access/lib/require-access');
vi.mock('./cookies', () => ({ getAllAccessTokenCookies: mockCookies }));
vi.mock('./access-token', () => ({ verifyProjectAccessToken: mockBasic }));
vi.mock('./project-session', () => ({ verifyProjectSessionToken: mockVerify }));

const payloadFor = (projectId: string): ProjectAccessTokenPayload => ({
  type: 'project_access',
  projectId,
  projectName: 'sample',
  issuedAt: 0,
  expiresAt: Number.MAX_SAFE_INTEGER,
});

/** 토큰 문자열 → 1차 검증 결과. 세션 검증은 기본적으로 1차와 같게 둔다. */
function tokens(map: Record<string, string | null>) {
  const result = (t: string) =>
    map[t]
      ? { valid: true, payload: payloadFor(map[t]!) }
      : { valid: false, error: 'TOKEN_INVALID' };
  mockBasic.mockImplementation(async (t: string) => result(t));
  mockVerify.mockImplementation(async (t: string) => result(t));
}

describe('requireProjectAccess', () => {
  beforeEach(() => {
    mockCookies.mockReset();
    mockBasic.mockReset();
    mockVerify.mockReset();
  });

  it('유효 토큰이 대상 projectId 와 일치하면 true', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'token']]));
    tokens({ token: 'proj-1' });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(true);
  });

  it('유효 토큰이지만 다른 projectId 면 false (IDOR 차단)', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'token']]));
    tokens({ token: 'proj-OTHER' });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('무효(서명/만료) 토큰이면 false', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'bad']]));
    tokens({ bad: null });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('여러 쿠키 중 하나라도 대상과 일치하면 true', async () => {
    mockCookies.mockResolvedValue(
      new Map([
        ['a', 'token-a'],
        ['b', 'token-b'],
      ])
    );
    tokens({ 'token-a': 'other', 'token-b': 'proj-1' });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(true);
  });

  it('대상이 아닌 프로젝트 토큰은 DB 로 대조하지 않는다', async () => {
    mockCookies.mockResolvedValue(
      new Map([
        ['a', 'token-a'],
        ['b', 'token-b'],
      ])
    );
    tokens({ 'token-a': 'other', 'token-b': 'proj-1' });

    await requireProjectAccess('proj-1');
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(mockVerify).toHaveBeenCalledWith('token-b');
  });

  it('서명은 유효해도 DB 에서 폐기된 세션이면 false', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'token']]));
    tokens({ token: 'proj-1' });
    mockVerify.mockResolvedValue({ valid: false, error: 'TOKEN_INVALID' });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('쿠키가 하나도 없으면 false', async () => {
    mockCookies.mockResolvedValue(new Map());

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('쿠키 조회가 throw 하면 false (fail-closed)', async () => {
    mockCookies.mockRejectedValue(new Error('cookie store unavailable'));

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });
});
