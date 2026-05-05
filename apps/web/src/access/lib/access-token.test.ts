import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createProjectAccessToken,
  verifyProjectAccessToken,
  parseTokenPayload,
  getTokenRemainingTime,
} from './access-token';

describe('접근 토큰 (access-token)', () => {
  beforeEach(() => {
    vi.stubEnv('ACCESS_TOKEN_SECRET', 'test-secret-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createProjectAccessToken', () => {
    it('유효한 JWT 토큰을 생성해야 한다', async () => {
      const projectId = 'project-123';
      const projectName = 'test-project';

      const token = await createProjectAccessToken(projectId, projectName);

      // JWT 형식 검증 (header.payload.signature)
      expect(token.split('.')).toHaveLength(3);
    });

    it('생성된 토큰이 올바른 페이로드를 포함해야 한다', async () => {
      const projectId = 'project-123';
      const projectName = 'test-project';

      const token = await createProjectAccessToken(projectId, projectName);
      const payload = parseTokenPayload(token);

      expect(payload).not.toBeNull();
      expect(payload?.type).toBe('project_access');
      expect(payload?.projectId).toBe(projectId);
      expect(payload?.projectName).toBe(projectName);
      expect(payload?.issuedAt).toBeDefined();
      expect(payload?.expiresAt).toBeDefined();
    });

    it('기본 만료 시간은 24시간이어야 한다', async () => {
      const token = await createProjectAccessToken('project-123', 'test-project');
      const payload = parseTokenPayload(token);

      const expectedDuration = 24 * 60 * 60; // 24시간 (초)
      const actualDuration = payload!.expiresAt - payload!.issuedAt;

      expect(actualDuration).toBe(expectedDuration);
    });

    it('커스텀 만료 시간을 설정할 수 있어야 한다', async () => {
      const customExpiresIn = 60 * 60; // 1시간
      const token = await createProjectAccessToken('project-123', 'test-project', {
        expiresIn: customExpiresIn,
      });
      const payload = parseTokenPayload(token);

      const actualDuration = payload!.expiresAt - payload!.issuedAt;

      expect(actualDuration).toBe(customExpiresIn);
    });
  });

  describe('verifyProjectAccessToken', () => {
    it('유효한 토큰을 성공적으로 검증해야 한다', async () => {
      const projectId = 'project-123';
      const projectName = 'test-project';
      const token = await createProjectAccessToken(projectId, projectName);

      const result = await verifyProjectAccessToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.projectId).toBe(projectId);
        expect(result.payload.projectName).toBe(projectName);
      }
    });

    it('잘못된 형식의 토큰은 TOKEN_INVALID 에러를 반환해야 한다', async () => {
      const invalidToken = 'invalid-token-format';

      const result = await verifyProjectAccessToken(invalidToken);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('TOKEN_INVALID');
      }
    });

    it('서명이 변조된 토큰은 TOKEN_INVALID 에러를 반환해야 한다', async () => {
      const token = await createProjectAccessToken('project-123', 'test-project');
      const [header, payload] = token.split('.');
      const tamperedToken = `${header}.${payload}.tampered-signature`;

      const result = await verifyProjectAccessToken(tamperedToken);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('TOKEN_INVALID');
      }
    });

    it('만료된 토큰은 TOKEN_EXPIRED 에러를 반환해야 한다', async () => {
      // 이미 만료된 토큰 생성 (만료 시간 -1초)
      const token = await createProjectAccessToken('project-123', 'test-project', {
        expiresIn: -1,
      });

      const result = await verifyProjectAccessToken(token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('TOKEN_EXPIRED');
      }
    });

    it('페이로드 타입이 다른 토큰은 TOKEN_INVALID 에러를 반환해야 한다', async () => {
      // 수동으로 잘못된 타입의 토큰 구성
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const payload = Buffer.from(
        JSON.stringify({
          type: 'invalid_type',
          projectId: 'project-123',
          projectName: 'test-project',
          issuedAt: Math.floor(Date.now() / 1000),
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        })
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const fakeToken = `${header}.${payload}.fake-signature`;

      const result = await verifyProjectAccessToken(fakeToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('parseTokenPayload', () => {
    it('유효한 토큰에서 페이로드를 추출해야 한다', async () => {
      const projectId = 'project-123';
      const projectName = 'test-project';
      const token = await createProjectAccessToken(projectId, projectName);

      const payload = parseTokenPayload(token);

      expect(payload).not.toBeNull();
      expect(payload?.projectId).toBe(projectId);
      expect(payload?.projectName).toBe(projectName);
    });

    it('잘못된 형식의 토큰은 null을 반환해야 한다', () => {
      const payload = parseTokenPayload('invalid-token');

      expect(payload).toBeNull();
    });

    it('빈 문자열은 null을 반환해야 한다', () => {
      const payload = parseTokenPayload('');

      expect(payload).toBeNull();
    });

    it('Base64 디코딩 실패 시 null을 반환해야 한다', () => {
      const payload = parseTokenPayload('part1.!!!invalid-base64!!!.part3');

      expect(payload).toBeNull();
    });
  });

  describe('getTokenRemainingTime', () => {
    it('유효한 토큰의 남은 시간을 반환해야 한다', async () => {
      const expiresIn = 3600; // 1시간
      const token = await createProjectAccessToken('project-123', 'test-project', {
        expiresIn,
      });

      const remaining = getTokenRemainingTime(token);

      // 약간의 실행 시간 차이를 허용
      expect(remaining).toBeGreaterThan(expiresIn - 5);
      expect(remaining).toBeLessThanOrEqual(expiresIn);
    });

    it('만료된 토큰은 0을 반환해야 한다', async () => {
      const token = await createProjectAccessToken('project-123', 'test-project', {
        expiresIn: -1,
      });

      const remaining = getTokenRemainingTime(token);

      expect(remaining).toBe(0);
    });

    it('잘못된 토큰은 0을 반환해야 한다', () => {
      const remaining = getTokenRemainingTime('invalid-token');

      expect(remaining).toBe(0);
    });
  });
});
