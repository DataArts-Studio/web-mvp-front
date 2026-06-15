import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { timingSafeEqual } from 'node:crypto';

/**
 * 백오피스 v1 임시 인증 게이트 (환경변수 공유키).
 *
 * 정식 Supabase Auth + RBAC 는 [BO12] 로 분리. 그전까지 사이트 전역 공지 발행 같은
 * 위험 액션을 무인증으로 두지 않기 위한 최소 안전장치다.
 *
 * - 운영자가 `/notices/gate` 에서 공유키를 입력하면 httpOnly 쿠키로 보관한다.
 * - 모든 페이지/서버 액션은 이 쿠키를 `BACKOFFICE_ADMIN_SECRET` 과 상수시간 비교한다.
 * - 시크릿 미설정(fail-closed) 이면 누구도 통과하지 못한다.
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

/** 현재 요청이 인증된 운영자 세션인지. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return isValidSecret(store.get(ADMIN_COOKIE)?.value);
}

/**
 * 인증되지 않았으면 게이트로 리다이렉트한다 (페이지/레이아웃용).
 * @param redirectTo 인증 후 돌아올 경로
 */
export async function requireAdmin(redirectTo = '/notices'): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect(`${GATE_PATH}?redirect=${encodeURIComponent(redirectTo)}`);
  }
}

/**
 * 서버 액션 진입 가드. 인증 안 됐으면 throw (액션 중단).
 * 페이지 가드(requireAdmin)와 달리 리다이렉트 대신 예외로 mutation 을 막는다.
 */
export async function assertAdminAction(): Promise<void> {
  if (!(await isAdminAuthed())) {
    throw new Error('UNAUTHORIZED: 운영자 인증이 필요합니다.');
  }
}
