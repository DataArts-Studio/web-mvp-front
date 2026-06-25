import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getClientIp, rateLimit } from './rate-limit';

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
