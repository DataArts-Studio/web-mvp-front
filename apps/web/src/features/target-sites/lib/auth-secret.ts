import { encrypt } from '@/shared/lib/crypto';

import type { TargetSiteAuthSecret } from '../model/types';

/**
 * 인증 시크릿 객체에 실제 값이 하나라도 있는지 판별한다.
 * 빈 객체나 빈 헤더/쿠키 맵은 "인증 없음"으로 본다.
 */
export function hasAuthValues(auth: TargetSiteAuthSecret | null | undefined): boolean {
  if (!auth) return false;
  if (auth.username || auth.password) return true;
  if (auth.headers && Object.keys(auth.headers).length > 0) return true;
  if (auth.cookies && Object.keys(auth.cookies).length > 0) return true;
  return false;
}

/**
 * 인증 시크릿을 암호화된 컬럼 값으로 변환한다.
 * 값이 없으면 null 을 반환해 평문/빈 ciphertext 저장을 피한다.
 */
export function encryptAuthSecret(auth: TargetSiteAuthSecret | null | undefined): string | null {
  if (!hasAuthValues(auth)) return null;
  return encrypt(JSON.stringify(auth));
}
