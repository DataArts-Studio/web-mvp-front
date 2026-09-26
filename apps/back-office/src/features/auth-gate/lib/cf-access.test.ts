import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCfAccessEmail } from './cf-access';

const mocks = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  jwtVerify: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => mocks.headers.get(k.toLowerCase()) ?? null }),
}));
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'jwks'),
  jwtVerify: mocks.jwtVerify,
}));

describe('getCfAccessEmail', () => {
  beforeEach(() => {
    mocks.headers.clear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('검증 설정이 없으면 이메일 헤더가 있어도 인증하지 않는다 (fail-closed)', async () => {
    mocks.headers.set('cf-access-authenticated-user-email', 'attacker@example.com');
    mocks.headers.set('cf-access-jwt-assertion', 'forged');
    expect(await getCfAccessEmail()).toBeNull();
    expect(mocks.jwtVerify).not.toHaveBeenCalled();
  });

  describe('검증 설정이 있을 때', () => {
    beforeEach(() => {
      vi.stubEnv('CF_ACCESS_TEAM_DOMAIN', 'team.cloudflareaccess.com');
      vi.stubEnv('CF_ACCESS_AUD', 'aud-tag');
    });

    it('JWT 가 없으면 이메일 헤더만으로는 인증하지 않는다', async () => {
      mocks.headers.set('cf-access-authenticated-user-email', 'attacker@example.com');
      expect(await getCfAccessEmail()).toBeNull();
    });

    it('JWT 검증에 실패하면 null', async () => {
      mocks.headers.set('cf-access-jwt-assertion', 'bad');
      mocks.jwtVerify.mockRejectedValueOnce(new Error('invalid'));
      expect(await getCfAccessEmail()).toBeNull();
    });

    it('검증된 JWT 의 이메일을 쓰고, 헤더 이메일은 무시한다', async () => {
      mocks.headers.set('cf-access-authenticated-user-email', 'spoofed@example.com');
      mocks.headers.set('cf-access-jwt-assertion', 'good');
      mocks.jwtVerify.mockResolvedValueOnce({ payload: { email: 'admin@testea.com' } });
      expect(await getCfAccessEmail()).toBe('admin@testea.com');
      expect(mocks.jwtVerify).toHaveBeenCalledWith('good', 'jwks', {
        audience: 'aud-tag',
        issuer: 'https://team.cloudflareaccess.com',
      });
    });
  });
});
