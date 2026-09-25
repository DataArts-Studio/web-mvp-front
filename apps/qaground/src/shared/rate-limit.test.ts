import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getClientIp, rateLimit, rateLimitBucketCount } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('윈도우 안에서 limit 회까지 허용하고 그 다음을 거부한다', () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    const third = rateLimit(key, 2, 1000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it('윈도우가 지나면 카운트를 리셋한다', () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
    expect(rateLimit(key, 1, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
  });

  it('키가 다르면 카운트가 독립적이다', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 1000).allowed).toBe(true);
    expect(rateLimit(a, 1, 1000).allowed).toBe(false);
    expect(rateLimit(b, 1, 1000).allowed).toBe(true);
  });

  it('limit 이나 windowMs 가 잘못되면 거부한다 (fail-closed)', () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 0, 1000).allowed).toBe(false);
    expect(rateLimit(key, 1, 0).allowed).toBe(false);
    expect(rateLimit(key, Number.NaN, 1000).allowed).toBe(false);
  });

  it('버킷이 임계치에 닿으면 만료된 버킷을 정리한다', () => {
    for (let i = 0; i < 10_000; i += 1) rateLimit(`fill-${i}-${Math.random()}`, 1, 1000);
    expect(rateLimitBucketCount()).toBeGreaterThanOrEqual(10_000);
    vi.advanceTimersByTime(1000);
    rateLimit(`trigger-${Math.random()}`, 1, 1000);
    // 채운 1만 개는 모두 만료돼 지워진다. 앞선 테스트의 미만료 버킷 몇 개만 남을 수 있다.
    expect(rateLimitBucketCount()).toBeLessThan(10);
  });
});

describe('getClientIp', () => {
  it('x-real-ip 를 우선한다', () => {
    const req = new Request('https://x.test', {
      headers: { 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('x-real-ip 가 없으면 XFF 의 우측(신뢰 hop)을 쓴다', () => {
    const req = new Request('https://x.test', {
      headers: { 'x-forwarded-for': '5.5.5.5, 6.6.6.6, 7.7.7.7' },
    });
    expect(getClientIp(req)).toBe('7.7.7.7');
  });

  it('신뢰 헤더가 없으면 unknown 으로 떨어진다', () => {
    const req = new Request('https://x.test');
    expect(getClientIp(req)).toBe('unknown');
  });
});
