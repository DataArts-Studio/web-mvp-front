/**
 * 익명 사용자 식별 쿠키.
 *
 * Testea 는 user 계정 모델이 없어서(프로젝트 패스워드 인증) 공지 읽음 같은
 * 사용자 단위 상태를 추적할 안정적인 키가 없다. 임시 해결책으로 디바이스(브라우저)
 * 단위 익명 UUID 를 쿠키에 발급해서 키로 사용한다.
 *
 * 향후 정식 계정이 도입되면 announcement_reads.user_id 를 계정 user_id 로 옮길 수
 * 있도록 schema 는 그대로 두되, 이 헬퍼만 갈아끼우면 된다.
 *
 * - 쿠키 이름: `testea_anon_id`
 * - 값: UUIDv4
 * - 속성: httpOnly, sameSite=lax, maxAge 1 년, secure(prod 한정)
 */
import { cookies } from 'next/headers';

import { randomUUID } from 'crypto';

const COOKIE_NAME = 'testea_anon_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 쿠키에서 익명 ID 를 읽어 반환한다. 없거나 형식이 잘못되면 `null`.
 * 서버 컴포넌트에서 호출 가능 (쿠키를 쓰지 않으므로 read-only 컨텍스트 OK).
 */
export async function readAnonId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value || !UUID_PATTERN.test(value)) return null;
  return value;
}

/**
 * 쿠키에서 익명 ID 를 읽고, 없으면 새로 생성해서 쿠키를 굽고 반환한다.
 *
 * 쿠키 쓰기가 가능한 컨텍스트(route handler / server action / middleware)에서만 호출.
 * 서버 컴포넌트(read-only)에서는 `readAnonId` 를 쓰고, 없을 때 카운트 = 활성 공지
 * 전체로 fallback 한다.
 */
export async function ensureAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing && UUID_PATTERN.test(existing)) return existing;

  const next = randomUUID();
  store.set({
    name: COOKIE_NAME,
    value: next,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
  return next;
}

export const ANON_ID_COOKIE_NAME = COOKIE_NAME;
