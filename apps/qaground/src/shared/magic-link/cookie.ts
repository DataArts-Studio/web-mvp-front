import { cookies } from 'next/headers';

/**
 * 베타 접근 쿠키. 매직링크 검증 후 토큰을 httpOnly 쿠키로 주입하고,
 * /beta 에서 이 쿠키의 토큰을 다시 검증해 접근을 가른다.
 */
const COOKIE_NAME = 'qaground_beta_access';
/** 토큰 만료(30분)와 동일하게. */
const MAX_AGE = 30 * 60;

export async function setBetaAccessCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getBetaAccessCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export async function clearBetaAccessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
