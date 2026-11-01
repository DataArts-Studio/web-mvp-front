import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { initCloudflareDb } from '@/shared/db/cloudflare-db';
import { createHash, timingSafeEqual } from 'node:crypto';

import { verifyAdminSession } from './admin-session';
import { warnIfWeakSecret } from './secret-strength';

/**
 * 백오피스 v1 임시 인증 게이트 (환경변수 공유키).
 *
 * 정식 Supabase Auth + RBAC 는 [BO12] 로 분리. 그전까지 사이트 전역 공지 발행 같은
 * 위험 액션을 무인증으로 두지 않기 위한 최소 안전장치다.
 *
 * - 공유키 검증 후 난수 세션을 httpOnly 쿠키로 발급한다.
 * - 페이지/서버 액션은 DB의 세션 만료·폐기 및 현재 공유키 버전을 검증한다.
 * - 시크릿 미설정(fail-closed) 이면 누구도 통과하지 못한다.
 */
export const ADMIN_COOKIE = 'bo_admin_session';
const GATE_PATH = '/notices/gate';

/**
 * 상수시간 문자열 비교. 양쪽을 SHA-256 다이제스트(고정 32바이트)로 바꿔 비교하므로
 * 길이 차이로 일찍 끝나지 않고, 비교 시간으로 공유키 길이가 드러나지 않는다.
 */
function safeEqual(a: string, b: string): boolean {
  const da = createHash('sha256').update(a).digest();
  const db = createHash('sha256').update(b).digest();
  return timingSafeEqual(da, db);
}

/** 입력값이 설정된 공유키와 일치하는지. 시크릿 미설정 시 항상 false. */
export function isValidSecret(candidate: string | undefined | null): boolean {
  const secret = process.env.BACKOFFICE_ADMIN_SECRET;
  if (!secret || !candidate) return false;
  warnIfWeakSecret(secret);
  return safeEqual(candidate, secret);
}

/** 현재 요청이 인증된 운영자 세션인지. */
export async function isAdminAuthed(): Promise<boolean> {
  initCloudflareDb();
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
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
