/**
 * 공개 라우트 남용 방지용 인메모리 레이트리밋 (qaground).
 *
 * - 채점 라우트(/api/challenges/[slug]/run)는 인증 없이 임의 코드를 격리 러너로 보낸다.
 *   봇·스크립트의 대량 호출을 IP 단위로 제한해 비용/자원 남용과 러너 포화를 막는다.
 *
 * ⚠️ 한계(프로덕션 전 인지): 인메모리 Map 은 서버 재시작 시 초기화되고, 멀티 인스턴스
 *   배포에서는 인스턴스별 독립 카운팅이라 정확하지 않다. 단일/소수 인스턴스 베타 전제다.
 *   강한 보장이 필요하면 Redis 등 공유 스토어로 전환한다.
 */

interface Bucket {
  count: number;
  /** 윈도우 만료 시각(epoch ms). 이 시각이 지나면 카운트를 리셋한다. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** 거부 시 다음 시도까지 권장 대기(ms). 허용 시 0. */
  retryAfterMs: number;
}

/**
 * 고정 윈도우 카운터. key 가 windowMs 안에서 limit 회를 넘기면 거부한다.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * 신뢰 가능한 클라이언트 IP 추출 (레이트리밋 키용).
 * x-forwarded-for 의 좌측 값은 클라이언트가 조작 가능하므로 신뢰하지 않는다.
 * 플랫폼이 설정하는 x-real-ip 를 우선하고, 없으면 XFF 의 우측(가장 가까운 신뢰 hop)을 쓴다.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
}
