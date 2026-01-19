import { describe, it, expect } from 'vitest';

import {
  hashPassword,
  verifyPassword,
  hashPasswordSync,
  verifyPasswordSync,
} from './password-hash';

describe('비밀번호 해시 (password-hash)', () => {
  const testPassword = 'test-password-123!@#';

  describe('hashPassword (비동기)', () => {
    it('비밀번호를 bcrypt 해시로 변환해야 한다', async () => {
      const hash = await hashPassword(testPassword);

      // bcrypt 해시 형식 검증 ($2a$ 또는 $2b$ 로 시작)
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('같은 비밀번호도 매번 다른 해시를 생성해야 한다', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('빈 문자열도 해시할 수 있어야 한다', async () => {
      const hash = await hashPassword('');

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('특수문자가 포함된 비밀번호도 해시할 수 있어야 한다', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?한글';
      const hash = await hashPassword(specialPassword);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('매우 긴 비밀번호도 해시할 수 있어야 한다', async () => {
      const longPassword = 'a'.repeat(72); // bcrypt는 72바이트까지 처리
      const hash = await hashPassword(longPassword);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });
  });

  describe('verifyPassword (비동기)', () => {
    it('올바른 비밀번호는 true를 반환해야 한다', async () => {
      const hash = await hashPassword(testPassword);

      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('틀린 비밀번호는 false를 반환해야 한다', async () => {
      const hash = await hashPassword(testPassword);

      const isValid = await verifyPassword('wrong-password', hash);

      expect(isValid).toBe(false);
    });

    it('대소문자가 다른 비밀번호는 false를 반환해야 한다', async () => {
      const hash = await hashPassword('Password123');

      const isValid = await verifyPassword('password123', hash);

      expect(isValid).toBe(false);
    });

    it('빈 문자열 비밀번호도 검증할 수 있어야 한다', async () => {
      const hash = await hashPassword('');

      const isValidEmpty = await verifyPassword('', hash);
      const isValidNonEmpty = await verifyPassword('something', hash);

      expect(isValidEmpty).toBe(true);
      expect(isValidNonEmpty).toBe(false);
    });

    it('공백이 추가된 비밀번호는 false를 반환해야 한다', async () => {
      const hash = await hashPassword(testPassword);

      const isValid = await verifyPassword(` ${testPassword}`, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('hashPasswordSync (동기)', () => {
    it('비밀번호를 동기적으로 해시해야 한다', () => {
      const hash = hashPasswordSync(testPassword);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('같은 비밀번호도 매번 다른 해시를 생성해야 한다', () => {
      const hash1 = hashPasswordSync(testPassword);
      const hash2 = hashPasswordSync(testPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPasswordSync (동기)', () => {
    it('올바른 비밀번호는 true를 반환해야 한다', () => {
      const hash = hashPasswordSync(testPassword);

      const isValid = verifyPasswordSync(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('틀린 비밀번호는 false를 반환해야 한다', () => {
      const hash = hashPasswordSync(testPassword);

      const isValid = verifyPasswordSync('wrong-password', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('비동기/동기 호환성', () => {
    it('비동기로 생성한 해시를 동기로 검증할 수 있어야 한다', async () => {
      const hash = await hashPassword(testPassword);

      const isValid = verifyPasswordSync(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('동기로 생성한 해시를 비동기로 검증할 수 있어야 한다', async () => {
      const hash = hashPasswordSync(testPassword);

      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });
  });
});
