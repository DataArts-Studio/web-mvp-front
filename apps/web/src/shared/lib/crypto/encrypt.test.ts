import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CryptoError, decrypt, encrypt } from './encrypt';

// 32 바이트(=64 hex 자리) 더미 키. 테스트 안에서만 사용.
const VALID_KEY = 'a'.repeat(64);

describe('crypto encrypt/decrypt', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });

  describe('round-trip', () => {
    it('일반 문자열 round-trip', () => {
      const plain = 'hello, 안녕 🌱';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('빈 문자열 round-trip (AES-GCM 은 0 byte ciphertext 가 정상)', () => {
      // 사전 길이 검증이 등호를 포함하면 이 케이스가 MALFORMED 로 잘못 거부된다.
      expect(decrypt(encrypt(''))).toBe('');
    });
  });

  describe('getEncryptionKey 검증', () => {
    it('KEY env 누락 시 KEY_NOT_SET 으로 거부', () => {
      delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
      expect(() => encrypt('x')).toThrow(CryptoError);
      try {
        encrypt('x');
      } catch (e) {
        expect((e as CryptoError).code).toBe('KEY_NOT_SET');
      }
    });

    it('hex 형식이 아니거나 길이가 다른 키는 KEY_INVALID 로 거부 (비-hex 문자 뒤섞임 포함)', () => {
      // 64자 길이지만 마지막 두 글자가 비-hex 인 키. 이전 검증(Buffer 길이만)은 통과했지만 정규식 검증은 거부.
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = `${'a'.repeat(62)}zz`;
      try {
        encrypt('x');
        throw new Error('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(CryptoError);
        expect((e as CryptoError).code).toBe('KEY_INVALID');
      }
    });

    it('길이만 짧은 키도 KEY_INVALID', () => {
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = 'abcd';
      try {
        encrypt('x');
        throw new Error('expected throw');
      } catch (e) {
        expect((e as CryptoError).code).toBe('KEY_INVALID');
      }
    });
  });

  describe('decrypt 사전 검증', () => {
    it('iv+tag 보다 짧은 buffer 는 MALFORMED', () => {
      const tooShort = Buffer.alloc(20).toString('base64'); // 28 byte 미만
      try {
        decrypt(tooShort);
        throw new Error('expected throw');
      } catch (e) {
        expect((e as CryptoError).code).toBe('MALFORMED');
      }
    });
  });
});
