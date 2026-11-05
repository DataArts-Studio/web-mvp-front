import { headers } from 'next/headers';

import { getDatabase, rateLimitBuckets, sql } from '@testea/db';
import { eq } from 'drizzle-orm';
import 'server-only';

/**
 * DB 기반 레이트리밋 (#471).
 *
 * 서버리스 인스턴스마다 메모리에서 따로 세면 콜드스타트와 분산 요청에 무력해지므로,
 * 카운터를 rate_limit_buckets 테이블 한 행에 두고 upsert 한 번으로 원자적으로 센다.
 * 시간은 서버 시계가 아니라 DB now() 기준으로만 비교한다.
 */

export interface RateLimitResult {
  /** 이번 요청을 포함한 윈도 안의 횟수. */
  count: number;
  /** count 가 limit 이하면 true. */
  allowed: boolean;
  /** 카운터가 초기화되기까지 남은 시간(ms). */
  retryAfterMs: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  /**
   * true 면 마지막 시도 시각부터 windowMs 동안 유지한다(비밀번호 잠금처럼 시도할 때마다 연장).
   * 단, 이미 limit 에 도달한 뒤의 시도는 잠금 시간을 늘리지 않는다.
   * false 면 첫 시도부터 windowMs 고정 윈도.
   */
  sliding?: boolean;
}

/** 만료된 행이 쌓이지 않도록 가끔 한 번 정리한다. */
const SWEEP_PROBABILITY = 0.01;

/** 시도 한 번을 센다. 허용 여부와 상관없이 항상 카운트한다. */
export async function consumeRateLimit(
  key: string,
  { limit, windowMs, sliding = false }: RateLimitOptions
): Promise<RateLimitResult> {
  const db = getDatabase();
  const t = rateLimitBuckets;
  const window = sql`(${windowMs} * interval '1 millisecond')`;
  const expired = sql`${t.reset_at} <= now()`;

  const [row] = await db
    .insert(t)
    .values({ key, count: 1, reset_at: sql`now() + ${window}` })
    .onConflictDoUpdate({
      target: t.key,
      set: {
        count: sql`case when ${expired} then 1 else ${t.count} + 1 end`,
        reset_at: sliding
          ? sql`case when ${expired} or ${t.count} < ${limit} then now() + ${window} else ${t.reset_at} end`
          : sql`case when ${expired} then now() + ${window} else ${t.reset_at} end`,
      },
    })
    .returning({
      count: t.count,
      retryAfterMs: sql<number>`greatest(0, ceil(extract(epoch from (${t.reset_at} - now())) * 1000))::int`,
    });

  if (Math.random() < SWEEP_PROBABILITY) {
    await db.delete(t).where(sql`${t.reset_at} < now()`);
  }

  const count = row?.count ?? 1;
  return { count, allowed: count <= limit, retryAfterMs: row?.retryAfterMs ?? windowMs };
}

/** 성공한 시도 뒤 카운터를 지운다(비밀번호를 맞힌 경우). */
export async function clearRateLimit(key: string): Promise<void> {
  await getDatabase().delete(rateLimitBuckets).where(eq(rateLimitBuckets.key, key));
}

/**
 * 신뢰 가능한 클라이언트 IP 추출 (rate limit 키용).
 * x-forwarded-for 의 좌측 값은 클라이언트가 헤더로 조작 가능하므로 신뢰하지 않는다
 * (헤더 회전으로 락아웃 우회 방지). 플랫폼이 설정하는 x-real-ip 를 우선하고,
 * 없으면 XFF 의 우측(가장 가까운 신뢰 hop)을 사용한다.
 */
export function getClientIp(headerStore: { get(name: string): string | null }): string {
  const realIp = headerStore.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = headerStore.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
}

/** 공개 액션이 너무 자주 불렸을 때 돌려주는 안내 문구. */
export const RATE_LIMITED_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

/**
 * 인증 없이 부를 수 있는 공개 액션(검색, 이름 확인, 생성)을 IP 기준으로 제한한다.
 * 반복 호출로 프로젝트 이름을 열거하거나 대량 생성하는 것을 막는다.
 * 운영에서만 센다. 로컬·CI E2E 는 같은 IP 로 짧은 시간에 많이 부르므로 제외한다.
 * 제한에 걸렸으면 true.
 */
export async function isPublicActionLimited(
  action: string,
  options: Omit<RateLimitOptions, 'sliding'>
): Promise<boolean> {
  if (process.env.VERCEL_ENV !== 'production') return false;
  const ip = getClientIp(await headers());
  const result = await consumeRateLimit(`public:${action}:ip:${ip}`, options);
  return !result.allowed;
}
