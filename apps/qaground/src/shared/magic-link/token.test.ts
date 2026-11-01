import { beforeAll, describe, expect, it } from 'vitest';

import { createMagicToken, verifyMagicToken } from './token';

beforeAll(() => {
  process.env.QAGROUND_MAGIC_SECRET = 'test-secret-for-magic-link';
});

describe('magic-link token', () => {
  it('발급한 토큰을 검증하면 이메일을 돌려준다', async () => {
    const token = await createMagicToken('user@example.com');
    const result = await verifyMagicToken(token);
    expect(result).toEqual({ valid: true, email: 'user@example.com' });
  });

  it('만료된 토큰은 EXPIRED 로 거부된다', async () => {
    const token = await createMagicToken('user@example.com', -1);
    const result = await verifyMagicToken(token);
    expect(result).toEqual({ valid: false, error: 'EXPIRED' });
  });

  it('서명이 변조된 토큰은 INVALID 로 거부된다', async () => {
    const token = await createMagicToken('user@example.com');
    const lastChar = token.slice(-1);
    const tampered = token.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');
    const result = await verifyMagicToken(tampered);
    expect(result.valid).toBe(false);
  });

  it('페이로드만 바꾸고 서명을 유지하면 INVALID (위조 차단)', async () => {
    const real = await createMagicToken('user@example.com');
    const forged = await createMagicToken('attacker@evil.com');
    const [header, , signature] = real.split('.');
    const forgedPayload = forged.split('.')[1];
    const tampered = `${header}.${forgedPayload}.${signature}`;
    const result = await verifyMagicToken(tampered);
    expect(result.valid).toBe(false);
  });

  it('형식이 틀린 문자열은 INVALID', async () => {
    const result = await verifyMagicToken('not-a-token');
    expect(result).toEqual({ valid: false, error: 'INVALID' });
  });
});
