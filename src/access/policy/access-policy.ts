/**
 * 접근 정책 레이어
 *
 * 모든 접근 제어 판단은 이 레이어를 통해 수행.
 * User Auth와 Resource Access를 독립적으로 평가하고 결합.
 */

import type { AccessContext, AccessPolicy } from './types';
import { verifyProjectAccessToken } from '../lib/access-token';
import { getAccessTokenCookie } from '../lib/cookies';

/**
 * 기본 접근 정책 구현
 *
 * 현재는 프로젝트 접근 토큰만 검증.
 * 추후 User Auth 추가 시 이 클래스만 수정하면 됨.
 */
class DefaultAccessPolicy implements AccessPolicy {
  /**
   * 프로젝트 ID로 접근 가능 여부 판단
   */
  async canAccessProject(projectId: string, context: AccessContext): Promise<boolean> {
    // 1. 프로젝트 접근 토큰 검증
    if (context.projectAccessToken) {
      if (context.projectAccessToken.projectId === projectId) {
        return true;
      }
    }

    // 2. 사용자 세션 검증 (추후 구현)
    // if (context.userSession) {
    //   const hasPermission = await checkUserProjectPermission(
    //     context.userSession.userId,
    //     projectId
    //   );
    //   if (hasPermission) {
    //     return true;
    //   }
    // }

    return false;
  }

  /**
   * 프로젝트 이름으로 접근 가능 여부 판단
   */
  async canAccessProjectByName(projectName: string, context: AccessContext): Promise<boolean> {
    // 프로젝트 접근 토큰 검증
    if (context.projectAccessToken) {
      if (context.projectAccessToken.projectName === projectName) {
        return true;
      }
    }

    // 사용자 세션 검증 (추후 구현)
    // if (context.userSession) { ... }

    return false;
  }
}

/**
 * 싱글톤 정책 인스턴스
 */
const accessPolicy = new DefaultAccessPolicy();

/**
 * 접근 정책 인스턴스 반환
 */
export function getAccessPolicy(): AccessPolicy {
  return accessPolicy;
}

/**
 * 쿠키에서 접근 컨텍스트 구성 (Server Component/Action용)
 * @param projectName - 프로젝트 이름
 * @returns 접근 컨텍스트
 */
export async function buildAccessContext(projectName: string): Promise<AccessContext> {
  const context: AccessContext = {};

  // 프로젝트 접근 토큰 조회 및 검증
  const token = await getAccessTokenCookie(projectName);
  if (token) {
    const result = await verifyProjectAccessToken(token);
    if (result.valid) {
      context.projectAccessToken = result.payload;
    }
  }

  // 사용자 세션 조회 (추후 구현)
  // const session = await getUserSession();
  // if (session) {
  //   context.userSession = session;
  // }

  return context;
}

/**
 * 프로젝트 접근 가능 여부 확인 (편의 함수)
 * @param projectName - 프로젝트 이름
 * @returns 접근 가능 여부
 */
export async function canAccessProject(projectName: string): Promise<boolean> {
  const context = await buildAccessContext(projectName);
  return accessPolicy.canAccessProjectByName(projectName, context);
}

/**
 * 프로젝트 접근 토큰 유효성 확인 (편의 함수)
 * @param projectName - 프로젝트 이름
 * @returns 토큰 정보 또는 null
 */
export async function getValidAccessToken(projectName: string): Promise<AccessContext['projectAccessToken'] | null> {
  const token = await getAccessTokenCookie(projectName);
  if (!token) {
    return null;
  }

  const result = await verifyProjectAccessToken(token);
  if (!result.valid) {
    return null;
  }

  return result.payload;
}
