import type { TargetSiteAuthSecret } from '@/features/target-sites/model/types';
import 'server-only';

/**
 * Playwright storageState 최소 형태. 러너의 newContext({storageState}) 에 그대로 넘긴다.
 */
export interface PlaywrightStorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Lax' | 'Strict' | 'None';
  }>;
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
}

/**
 * 대상 사이트 인증 시크릿을 Playwright storageState 로 변환한다.
 *
 * 이번 스코프: cookies / headers(쿠키화 불가하므로 storageState 로는 표현 못 함, 주석 참고)만.
 * username/password 폼 로그인 자동화는 이번 스코프 밖이다(러너에서 로그인 시퀀스를
 * 수행해야 하고 셀렉터 추론이 필요). 인증이 없거나 cookies 가 없으면 null 을 반환해
 * baseUrl 만으로(비로그인 페이지) 동작하게 한다.
 *
 * 주의: HTTP 헤더(Authorization 등)는 storageState 로 표현할 수 없다. 헤더 주입이
 * 필요한 대상은 러너 계약 확장(extraHTTPHeaders)이 별도로 필요하며 이번 스코프 밖이다.
 *
 * @param baseUrl 쿠키 domain 추론용 대상 베이스 URL.
 */
export function buildStorageState(
  auth: TargetSiteAuthSecret | null,
  baseUrl: string
): PlaywrightStorageState | null {
  if (!auth?.cookies || Object.keys(auth.cookies).length === 0) {
    return null;
  }

  let domain: string;
  try {
    domain = new URL(baseUrl).hostname;
  } catch {
    return null;
  }

  const cookies = Object.entries(auth.cookies).map(([name, value]) => ({
    name,
    value,
    domain,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: baseUrl.startsWith('https://'),
    sameSite: 'Lax' as const,
  }));

  return { cookies, origins: [] };
}
