// '@/shared/lib/rate-limit' 의 테스트용 인메모리 대역. DB upsert 와 같은 규칙으로 센다.
import type { RateLimitOptions, RateLimitResult } from '@/shared/lib/rate-limit';

const buckets = new Map<string, { count: number; resetAt: number }>();

export const RATE_LIMITED_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

export async function consumeRateLimit(
  key: string,
  { limit, windowMs, sliding = false }: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    if (sliding && bucket.count < limit) bucket.resetAt = now + windowMs;
    bucket.count += 1;
  }
  const current = buckets.get(key)!;
  return {
    count: current.count,
    allowed: current.count <= limit,
    retryAfterMs: Math.max(0, current.resetAt - now),
  };
}

export async function clearRateLimit(key: string): Promise<void> {
  buckets.delete(key);
}

export function getClientIp(): string {
  return 'test-ip';
}

export async function isPublicActionLimited(
  action: string,
  options: Omit<RateLimitOptions, 'sliding'>
): Promise<boolean> {
  if (process.env.VERCEL_ENV !== 'production') return false;
  return !(await consumeRateLimit(`public:${action}:ip:test-ip`, options)).allowed;
}

export function resetRateLimitMock(): void {
  buckets.clear();
}
