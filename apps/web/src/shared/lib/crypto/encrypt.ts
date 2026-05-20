import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // aes-256 → 32 bytes

/**
 * 암복호화 실패를 호출부가 식별할 수 있게 타입으로 구분한다.
 * - KEY_NOT_SET / KEY_INVALID: 서버 환경(키) 설정 문제 (운영 대응 필요)
 * - AUTH_FAILED: 저장 시점과 다른 키로 복호화 시도 (키 로테이션/환경 불일치 등 사용자 환경)
 * - MALFORMED: 저장된 ciphertext 자체가 손상 (잘린 buffer, 잘못된 IV 길이 등 데이터 무결성 문제, 운영 대응 필요)
 *
 * `Error` 서브클래스이며 `message` 는 기존과 동일하게 유지하므로,
 * 일반 `catch (error)` 로 받던 기존 호출부(github 토큰/웹훅)는 무영향.
 */
export type CryptoErrorCode = 'KEY_NOT_SET' | 'KEY_INVALID' | 'AUTH_FAILED' | 'MALFORMED';

export class CryptoError extends Error {
  readonly code: CryptoErrorCode;

  constructor(code: CryptoErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CryptoError';
    this.code = code;
  }
}

function getEncryptionKey(): Buffer {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new CryptoError('KEY_NOT_SET', 'GITHUB_TOKEN_ENCRYPTION_KEY is not set');
  }
  // Buffer.from(key, 'hex') 는 첫 비-hex 문자에서 디코드를 멈추고 앞부분만 반환하므로,
  // 길이만 검증하면 64자리 hex 뒤에 오타가 붙은 키도 통과할 수 있다. 형식 자체를 먼저 본다.
  if (!/^[0-9a-fA-F]+$/.test(key) || key.length !== KEY_LENGTH * 2) {
    throw new CryptoError(
      'KEY_INVALID',
      `GITHUB_TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (got ${key.length} characters)`
    );
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv + tag + ciphertext → base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, 'base64');

  // 사전 길이 검증: iv + tag 도 채우지 못하면 데이터가 잘린 것.
  // AES-GCM 은 패딩 없는 스트림 암호라 빈 plaintext 도 28바이트(iv+tag) 정상 ciphertext 를 만들므로,
  // 등호를 포함하면 정상 케이스(encrypt('')) 까지 거부하는 회귀가 생긴다.
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new CryptoError(
      'MALFORMED',
      `ciphertext too short (${buf.length} bytes, expected >= ${IV_LENGTH + TAG_LENGTH})`
    );
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // GCM 인증 태그 검증 실패와 그 외 데이터 손상 오류를 분리한다.
    // 인증 실패(키 불일치/로테이션)는 사용자 환경 이슈로 키 재등록 안내,
    // 그 외(잘린 ciphertext 등 cipher 내부 구조 손상)는 데이터 무결성 문제로 운영 알림.
    const message = error instanceof Error ? error.message : 'decryption failed';
    const isAuthFailure = /unable to authenticate|authentication|auth tag|bad decrypt/i.test(
      message
    );
    throw new CryptoError(isAuthFailure ? 'AUTH_FAILED' : 'MALFORMED', message, { cause: error });
  }
}
