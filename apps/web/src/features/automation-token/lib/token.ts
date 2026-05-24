import { createHash, randomBytes } from 'node:crypto';

/**
 * 자동화 토큰 생성·해시 유틸 (FDD-TR09 V1).
 *
 * - 토큰 평문 형식: `testea_pk_<base64url(32 bytes)>` (총 53자)
 * - 노출 prefix: `testea_pk_` + 본체의 첫 8자 (총 18자) → DB 와 UI 에 노출
 * - 저장 hash: SHA-256(평문) hex. 평문 자체가 256-bit 랜덤이라 dictionary attack 위험 없음
 *   (Stripe / GitHub / Vercel 등 표준 API 키 저장 방식과 동일).
 */
const TOKEN_PREFIX = 'testea_pk_';
const SECRET_BYTES = 32;
const VISIBLE_PREFIX_LEN = TOKEN_PREFIX.length + 8;

export interface IssuedToken {
  /** UI 에 1회만 노출되는 평문. 저장 금지. */
  plaintext: string;
  /** DB·UI 표시용 prefix (예: `testea_pk_AbCdEfGh`) */
  prefix: string;
  /** DB 저장용 SHA-256 hex */
  hash: string;
}

export function generateAutomationToken(): IssuedToken {
  const secret = randomBytes(SECRET_BYTES).toString('base64url');
  const plaintext = `${TOKEN_PREFIX}${secret}`;
  const prefix = plaintext.slice(0, VISIBLE_PREFIX_LEN);
  const hash = hashAutomationToken(plaintext);
  return { plaintext, prefix, hash };
}

export function hashAutomationToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

export function extractTokenPrefix(plaintext: string): string {
  return plaintext.slice(0, VISIBLE_PREFIX_LEN);
}

export function isValidTokenFormat(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX) && value.length > VISIBLE_PREFIX_LEN;
}

export const AUTOMATION_TOKEN_PREFIX = TOKEN_PREFIX;
