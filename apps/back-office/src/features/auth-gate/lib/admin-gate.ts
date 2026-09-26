import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { initCloudflareDb } from '@/shared/db/cloudflare-db';
import { timingSafeEqual } from 'node:crypto';

import { getCfAccessEmail } from './cf-access';

/**
 * 백오피스 인증. 정식 Supabase Auth + RBAC 는 [BO12] 로 분리.
 *
 * 1. Cloudflare Access (운영 권장): 엣지에서 인증된 요청의 JWT 를 검증해 통과시킨다.
 *    검증 설정(`CF_ACCESS_TEAM_DOMAIN`·`CF_ACCESS_AUD`)이 없으면 이 경로는 꺼진다(cf-access.ts).
 * 2. 공유키 게이트 (폴백): 운영자가 `/notices/gate` 에서 공유키를 입력하면 httpOnly 쿠키로
 *    보관하고 `BACKOFFICE_ADMIN_SECRET` 과 상수시간 비교한다. 로그인 시도는 IP 락아웃을 받는다.
 *
 * 둘 다 설정되지 않았으면 누구도 통과하지 못한다(fail-closed).
 */
export const ADMIN_COOKIE = 'bo_admin_session';
const GATE_PATH = '/notices/gate';

/** 상수시간 문자열 비교. 길이 불일치는 즉시 false. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** 입력값이 설정된 공유키와 일치하는지. 시크릿 미설정 시 항상 false. */
export function isValidSecret(candidate: string | undefined | null): boolean {
  const secret = process.env.BACKOFFICE_ADMIN_SECRET;
  if (!secret || !candidate) return false;
  return safeEqual(candidate, secret);
}

/** 현재 요청이 인증된 운영자인지 (검증된 Cloudflare Access 또는 공유키 세션). */
export async function isAdminAuthed(): Promise<boolean> {
  if (await getCfAccessEmail()) return true;
  const store = await cookies();
  return isValidSecret(store.get(ADMIN_COOKIE)?.value);
}

/**
 * 인증되지 않았으면 게이트로 리다이렉트한다 (페이지/레이아웃용).
 * @param redirectTo 인증 후 돌아올 경로
 */
export async function requireAdmin(redirectTo = '/notices'): Promise<void> {
  // Cloudflare Workers 런타임이면 Hyperdrive DB 를 주입한다(다른 환경에선 no-op).
  initCloudflareDb();
  if (!(await isAdminAuthed())) {
    redirect(`${GATE_PATH}?redirect=${encodeURIComponent(redirectTo)}`);
  }
}

/**
 * 서버 액션 진입 가드. 인증 안 됐으면 throw (액션 중단).
 * 페이지 가드(requireAdmin)와 달리 리다이렉트 대신 예외로 mutation 을 막는다.
 */
export async function assertAdminAction(): Promise<void> {
  initCloudflareDb();
  if (!(await isAdminAuthed())) {
    throw new Error('UNAUTHORIZED: 운영자 인증이 필요합니다.');
  }
}
