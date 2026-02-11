/**
 * 접근 토큰 관리 라이브러리
 *
 * 프로젝트 접근 토큰의 생성, 검증, 파싱을 담당.
 * JWT 형식의 토큰을 사용하며, HMAC-SHA256으로 서명.
 */

import type { ProjectAccessTokenPayload, AccessTokenConfig, AccessError } from '../policy/types';
import { DEFAULT_ACCESS_TOKEN_CONFIG } from '../policy/types';

/**
 * Base64URL 인코딩 (브라우저/Node.js 호환)
 */
function base64UrlEncode(str: string): string {
  const base64 = Buffer.from(str, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64를 Base64URL로 변환 (이미 base64 인코딩된 문자열용)
 */
function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL 디코딩
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * HMAC-SHA256 서명 생성 (Node.js crypto 사용)
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha256', secret);
  hmac.update(data);
  // digest('base64')는 이미 base64 문자열을 반환하므로 base64ToBase64Url로 변환
  return base64ToBase64Url(hmac.digest('base64'));
}

/**
 * 토큰 시크릿 키 가져오기
 * 환경 변수에서 반드시 설정되어야 함 (모든 환경)
 */
function getTokenSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'ACCESS_TOKEN_SECRET environment variable is required. ' +
      'Set it in .env.local for development.'
    );
  }
  return secret;
}

/**
 * 프로젝트 접근 토큰 생성
 * @param projectId - 프로젝트 ID
 * @param projectName - 프로젝트 이름
 * @param config - 토큰 설정 (선택적)
 * @returns JWT 형식의 토큰 문자열
 */
export async function createProjectAccessToken(
  projectId: string,
  projectName: string,
  config: Partial<AccessTokenConfig> = {}
): Promise<string> {
  const mergedConfig = { ...DEFAULT_ACCESS_TOKEN_CONFIG, ...config };
  const now = Math.floor(Date.now() / 1000);

  const payload: ProjectAccessTokenPayload = {
    type: 'project_access',
    projectId,
    projectName,
    issuedAt: now,
    expiresAt: now + mergedConfig.expiresIn,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  const signature = await createSignature(`${headerEncoded}.${payloadEncoded}`, getTokenSecret());

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * 토큰 검증 결과
 */
export type TokenVerifyResult =
  | { valid: true; payload: ProjectAccessTokenPayload }
  | { valid: false; error: AccessError };

/**
 * 프로젝트 접근 토큰 검증
 * @param token - JWT 토큰 문자열
 * @returns 검증 결과와 페이로드
 */
export async function verifyProjectAccessToken(token: string): Promise<TokenVerifyResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'TOKEN_INVALID' };
    }

    const [headerEncoded, payloadEncoded, signature] = parts;

    // 서명 검증
    const expectedSignature = await createSignature(
      `${headerEncoded}.${payloadEncoded}`,
      getTokenSecret()
    );

    if (signature !== expectedSignature) {
      return { valid: false, error: 'TOKEN_INVALID' };
    }

    // 페이로드 파싱
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as ProjectAccessTokenPayload;

    // 타입 검증
    if (payload.type !== 'project_access') {
      return { valid: false, error: 'TOKEN_INVALID' };
    }

    // 만료 검증
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'TOKEN_INVALID' };
  }
}

/**
 * 토큰에서 페이로드 추출 (검증 없이, 디버깅용)
 * @param token - JWT 토큰 문자열
 * @returns 페이로드 또는 null
 */
export function parseTokenPayload(token: string): ProjectAccessTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1])) as ProjectAccessTokenPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * 토큰 만료까지 남은 시간 (초)
 * @param token - JWT 토큰 문자열
 * @returns 남은 시간 (초) 또는 0 (만료됨)
 */
export function getTokenRemainingTime(token: string): number {
  const payload = parseTokenPayload(token);
  if (!payload) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.expiresAt - now;
  return Math.max(0, remaining);
}
