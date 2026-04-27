/**
 * 비밀번호 해시 유틸리티
 *
 * bcrypt를 사용하여 비밀번호를 안전하게 해시하고 검증.
 * 원문은 절대 저장하지 않음.
 */

import bcrypt from 'bcryptjs';

/** bcrypt salt rounds - 보안과 성능의 균형 */
const SALT_ROUNDS = 12;

/**
 * 비밀번호를 bcrypt 해시로 변환
 * @param password - 원문 비밀번호
 * @returns bcrypt 해시 문자열
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호 검증
 * @param password - 입력된 원문 비밀번호
 * @param hash - 저장된 bcrypt 해시
 * @returns 일치 여부
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 동기 버전 - 해시 생성 (서버 초기화 등에서 사용)
 * @param password - 원문 비밀번호
 * @returns bcrypt 해시 문자열
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * 동기 버전 - 비밀번호 검증
 * @param password - 입력된 원문 비밀번호
 * @param hash - 저장된 bcrypt 해시
 * @returns 일치 여부
 */
export function verifyPasswordSync(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
