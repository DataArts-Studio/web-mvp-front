import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectAccessTokenPayload } from '../policy/types';
import { requireProjectAccess } from './require-access';

// vi.hoisted 로 mock 함수를 끌어올려 factory 와 테스트가 같은 인스턴스를 공유하게 한다.
const { mockCookies, mockVerify } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockVerify: vi.fn(),
}));

// setup-tests.ts 가 require-access 를 전역 mock(항상 true)으로 덮으므로, 이 파일에서는
// 실제 구현을 검증하기 위해 unmock 한 뒤 그 의존(cookies·access-token)만 모킹한다.
vi.unmock('@/access/lib/require-access');
vi.mock('./cookies', () => ({ getAllAccessTokenCookies: mockCookies }));
vi.mock('./access-token', () => ({ verifyProjectAccessToken: mockVerify }));

const payloadFor = (projectId: string): ProjectAccessTokenPayload => ({
  type: 'project_access',
  projectId,
  projectName: 'sample',
  issuedAt: 0,
  expiresAt: Number.MAX_SAFE_INTEGER,
});

describe('requireProjectAccess', () => {
  beforeEach(() => {
    mockCookies.mockReset();
    mockVerify.mockReset();
  });

  it('유효 토큰이 대상 projectId 와 일치하면 true', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'token']]));
    mockVerify.mockResolvedValue({ valid: true, payload: payloadFor('proj-1') });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(true);
  });

  it('유효 토큰이지만 다른 projectId 면 false (IDOR 차단)', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'token']]));
    mockVerify.mockResolvedValue({ valid: true, payload: payloadFor('proj-OTHER') });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('무효(서명/만료) 토큰이면 false', async () => {
    mockCookies.mockResolvedValue(new Map([['c', 'bad']]));
    mockVerify.mockResolvedValue({ valid: false, error: 'TOKEN_INVALID' });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(false);
  });

  it('여러 쿠키 중 하나라도 대상과 일치하면 true', async () => {
    mockCookies.mockResolvedValue(
      new Map([
        ['a', 'token-a'],
        ['b', 'token-b'],
      ])
    );
    mockVerify
      .mockResolvedValueOnce({ valid: true, payload: payloadFor('other') })
      .mockResolvedValueOnce({ valid: true, payload: payloadFor('proj-1') });

    await expect(requireProjectAccess('proj-1')).resolves.toBe(true);
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
