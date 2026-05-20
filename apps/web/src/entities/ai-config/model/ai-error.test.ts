import { CryptoError } from '@/shared/lib/crypto';
import { describe, expect, it } from 'vitest';

import { AiError } from './ai-error';

describe('AiError.fromCryptoError', () => {
  it('AUTH_FAILED → KEY_UNDECRYPTABLE (409, report=false)', () => {
    const e = AiError.fromCryptoError(new CryptoError('AUTH_FAILED', 'bad tag'));
    expect(e).toBeInstanceOf(AiError);
    expect(e).toBeInstanceOf(Error);
    expect(e.kind).toBe('KEY_UNDECRYPTABLE');
    expect(e.httpStatus).toBe(409);
    expect(e.report).toBe(false);
    expect(e.context).toMatchObject({ cryptoCode: 'AUTH_FAILED' });
  });

  it('KEY_NOT_SET → CRYPTO_MISCONFIG (500, report=true)', () => {
    const e = AiError.fromCryptoError(new CryptoError('KEY_NOT_SET', 'missing'));
    expect(e.kind).toBe('CRYPTO_MISCONFIG');
    expect(e.httpStatus).toBe(500);
    expect(e.report).toBe(true);
  });

  it('KEY_INVALID → CRYPTO_MISCONFIG (500)', () => {
    const e = AiError.fromCryptoError(new CryptoError('KEY_INVALID', 'len'));
    expect(e.kind).toBe('CRYPTO_MISCONFIG');
    expect(e.httpStatus).toBe(500);
  });
});

describe('AiError.fromProviderResponse', () => {
  const cases: Array<[number, string, number]> = [
    [401, 'PROVIDER_UNAUTHORIZED', 401],
    [403, 'PROVIDER_UNAUTHORIZED', 401],
    [404, 'PROVIDER_BAD_MODEL', 400],
    [429, 'PROVIDER_RATE_LIMITED', 429],
    [500, 'PROVIDER_UNAVAILABLE', 502],
    [503, 'PROVIDER_UNAVAILABLE', 502],
    [418, 'PROVIDER_ERROR', 502],
  ];

  it.each(cases)('status %i → kind %s (http %i)', (status, kind, http) => {
    const e = AiError.fromProviderResponse('openai', status, 'body');
    expect(e.kind).toBe(kind);
    expect(e.httpStatus).toBe(http);
    expect(e.context).toMatchObject({ provider: 'openai', providerStatus: status });
  });

  it('provider 응답 본문은 500자로 잘려 context 에만 담긴다 (사용자 메시지 비노출)', () => {
    const big = 'x'.repeat(2000);
    const e = AiError.fromProviderResponse('gemini', 400, big);
    expect((e.context.providerBody as string).length).toBe(500);
    expect(e.userMessage).not.toContain('x');
  });

  it('비정상 상태(418)는 report=true', () => {
    expect(AiError.fromProviderResponse('anthropic', 418, '').report).toBe(true);
  });

  it('레이트리밋(429)은 report=false', () => {
    expect(AiError.fromProviderResponse('anthropic', 429, '').report).toBe(false);
  });
});

describe('AiError.responseUnparsable', () => {
  it('RESPONSE_UNPARSABLE (502, report=true)', () => {
    const e = AiError.responseUnparsable(new Error('JSON'));
    expect(e.kind).toBe('RESPONSE_UNPARSABLE');
    expect(e.httpStatus).toBe(502);
    expect(e.report).toBe(true);
  });
});
