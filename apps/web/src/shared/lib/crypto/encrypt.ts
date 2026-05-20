import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // aes-256 → 32 bytes

/**
 * 암복호화 실패를 호출부가 식별할 수 있게 타입으로 구분한다.
 * - KEY_NOT_SET / KEY_INVALID: 서버 환경(키) 설정 문제 — 운영 대응 필요
 * - AUTH_FAILED: 저장 시점과 다른 키로 복호화 시도(키 로테이션/환경 불일치 등)
 *
 * `Error` 서브클래스이며 `message` 는 기존과 동일하게 유지하므로,
 * 일반 `catch (error)` 로 받던 기존 호출부(github 토큰/웹훅)는 무영향.
 */
export type CryptoErrorCode = 'KEY_NOT_SET' | 'KEY_INVALID' | 'AUTH_FAILED';

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
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new CryptoError(
      'KEY_INVALID',
      `GITHUB_TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH}-byte hex (got ${buf.length} bytes)`
    );
  }
  return buf;
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
    // GCM 인증 태그 검증 실패 등: 저장 시점과 다른 키로 복호화한 경우.
    // 원본 메시지를 보존해 기존 일반 catch 호출부 동작을 바꾸지 않는다.
    throw new CryptoError(
      'AUTH_FAILED',
      error instanceof Error ? error.message : 'decryption failed',
      { cause: error }
    );
  }
}
