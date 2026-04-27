/**
 * 접근 토큰 쿠키 유틸리티
 *
 * 프로젝트 접근 토큰을 안전하게 쿠키에 저장/조회/삭제.
 * httpOnly, secure, sameSite 옵션으로 보안 강화.
 */

import { cookies } from 'next/headers';
import type { AccessTokenConfig } from '../policy/types';
import { DEFAULT_ACCESS_TOKEN_CONFIG } from '../policy/types';

/**
 * 프로젝트 접근 토큰 쿠키 이름 생성
 * @param projectName - 프로젝트 이름
 * @returns 쿠키 이름
 */
export function getAccessTokenCookieName(projectName: string): string {
  // 쿠키 이름에 사용할 수 없는 문자 제거
  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${DEFAULT_ACCESS_TOKEN_CONFIG.cookiePrefix}_${sanitized}`;
}

/**
 * 프로젝트 접근 토큰 쿠키 설정 (Server Component/Action용)
 * @param projectName - 프로젝트 이름
 * @param token - 접근 토큰
 * @param config - 토큰 설정 (선택적)
 */
export async function setAccessTokenCookie(
  projectName: string,
  token: string,
  config: Partial<AccessTokenConfig> = {}
): Promise<void> {
  const mergedConfig = { ...DEFAULT_ACCESS_TOKEN_CONFIG, ...config };
  const cookieStore = await cookies();

  cookieStore.set(getAccessTokenCookieName(projectName), token, {
    httpOnly: true,
    secure: mergedConfig.secure,
    sameSite: 'lax',
    maxAge: mergedConfig.expiresIn,
    path: '/',
  });
}

/**
 * 프로젝트 접근 토큰 쿠키 조회 (Server Component/Action용)
 * @param projectName - 프로젝트 이름
 * @returns 토큰 문자열 또는 undefined
 */
export async function getAccessTokenCookie(projectName: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getAccessTokenCookieName(projectName))?.value;
}

/**
 * 프로젝트 접근 토큰 쿠키 삭제 (Server Component/Action용)
 * @param projectName - 프로젝트 이름
 */
export async function deleteAccessTokenCookie(projectName: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(getAccessTokenCookieName(projectName));
}

/**
 * 모든 프로젝트 접근 토큰 쿠키 조회 (Server Component/Action용)
 * @returns 프로젝트 이름과 토큰의 맵
 */
export async function getAllAccessTokenCookies(): Promise<Map<string, string>> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const prefix = DEFAULT_ACCESS_TOKEN_CONFIG.cookiePrefix;

  const tokens = new Map<string, string>();

  for (const cookie of allCookies) {
    if (cookie.name.startsWith(`${prefix}_`)) {
      const projectName = cookie.name.slice(`${prefix}_`.length);
      tokens.set(projectName, cookie.value);
    }
  }

  return tokens;
}

/**
 * 쿠키 옵션 생성 (클라이언트 측 삭제용)
 * Set-Cookie 헤더 문자열 생성
 */
export function createDeleteCookieHeader(projectName: string): string {
  const cookieName = getAccessTokenCookieName(projectName);
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
