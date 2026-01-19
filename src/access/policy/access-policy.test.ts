import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getAccessPolicy } from './access-policy';
import type { AccessContext, ProjectAccessTokenPayload } from './types';

// cookies 모듈 모킹
vi.mock('../lib/cookies', () => ({
  getAccessTokenCookie: vi.fn(),
}));

// access-token 모듈 모킹
vi.mock('../lib/access-token', () => ({
  verifyProjectAccessToken: vi.fn(),
}));

describe('접근 정책 (access-policy)', () => {
  const accessPolicy = getAccessPolicy();

  describe('canAccessProject (프로젝트 ID로 접근 검증)', () => {
    it('올바른 프로젝트 접근 토큰이 있으면 true를 반환해야 한다', async () => {
      const projectId = 'project-123';
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId,
        projectName: 'test-project',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
      };

      const result = await accessPolicy.canAccessProject(projectId, context);

      expect(result).toBe(true);
    });

    it('다른 프로젝트의 토큰으로는 접근이 거부되어야 한다', async () => {
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId: 'other-project',
        projectName: 'other-project',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
      };

      const result = await accessPolicy.canAccessProject('project-123', context);

      expect(result).toBe(false);
    });

    it('토큰이 없으면 접근이 거부되어야 한다', async () => {
      const context: AccessContext = {};

      const result = await accessPolicy.canAccessProject('project-123', context);

      expect(result).toBe(false);
    });

    it('토큰이 undefined이면 접근이 거부되어야 한다', async () => {
      const context: AccessContext = {
        projectAccessToken: undefined,
      };

      const result = await accessPolicy.canAccessProject('project-123', context);

      expect(result).toBe(false);
    });
  });

  describe('canAccessProjectByName (프로젝트 이름으로 접근 검증)', () => {
    it('올바른 프로젝트 접근 토큰이 있으면 true를 반환해야 한다', async () => {
      const projectName = 'test-project';
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId: 'project-123',
        projectName,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
      };

      const result = await accessPolicy.canAccessProjectByName(projectName, context);

      expect(result).toBe(true);
    });

    it('다른 프로젝트 이름의 토큰으로는 접근이 거부되어야 한다', async () => {
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId: 'project-123',
        projectName: 'other-project',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
      };

      const result = await accessPolicy.canAccessProjectByName('test-project', context);

      expect(result).toBe(false);
    });

    it('토큰이 없으면 접근이 거부되어야 한다', async () => {
      const context: AccessContext = {};

      const result = await accessPolicy.canAccessProjectByName('test-project', context);

      expect(result).toBe(false);
    });

    it('프로젝트 이름이 대소문자가 다르면 접근이 거부되어야 한다', async () => {
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId: 'project-123',
        projectName: 'Test-Project',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
      };

      const result = await accessPolicy.canAccessProjectByName('test-project', context);

      expect(result).toBe(false);
    });
  });

  describe('getAccessPolicy (싱글톤)', () => {
    it('항상 동일한 인스턴스를 반환해야 한다', () => {
      const policy1 = getAccessPolicy();
      const policy2 = getAccessPolicy();

      expect(policy1).toBe(policy2);
    });
  });

  describe('복합 접근 컨텍스트', () => {
    it('프로젝트 토큰과 사용자 세션이 모두 있을 때 토큰 검증이 우선되어야 한다', async () => {
      const projectId = 'project-123';
      const tokenPayload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId,
        projectName: 'test-project',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const context: AccessContext = {
        projectAccessToken: tokenPayload,
        // userSession은 추후 구현 예정
      };

      const result = await accessPolicy.canAccessProject(projectId, context);

      expect(result).toBe(true);
    });
  });
});

describe('접근 정책 타입 검증', () => {
  describe('ProjectAccessTokenPayload', () => {
    it('필수 필드가 모두 포함되어야 한다', () => {
      const payload: ProjectAccessTokenPayload = {
        type: 'project_access',
        projectId: 'project-123',
        projectName: 'test-project',
        issuedAt: 1234567890,
        expiresAt: 1234567890 + 3600,
      };

      expect(payload.type).toBe('project_access');
      expect(payload.projectId).toBeDefined();
      expect(payload.projectName).toBeDefined();
      expect(payload.issuedAt).toBeDefined();
      expect(payload.expiresAt).toBeDefined();
    });
  });

  describe('AccessContext', () => {
    it('빈 컨텍스트를 생성할 수 있어야 한다', () => {
      const context: AccessContext = {};

      expect(context.projectAccessToken).toBeUndefined();
      expect(context.userSession).toBeUndefined();
    });

    it('프로젝트 토큰만 포함한 컨텍스트를 생성할 수 있어야 한다', () => {
      const context: AccessContext = {
        projectAccessToken: {
          type: 'project_access',
          projectId: 'project-123',
          projectName: 'test-project',
          issuedAt: 1234567890,
          expiresAt: 1234567890 + 3600,
        },
      };

      expect(context.projectAccessToken).toBeDefined();
      expect(context.userSession).toBeUndefined();
    });
  });
});
