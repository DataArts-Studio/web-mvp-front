/**
 * 서버 액션용 프로젝트 접근 권한 검증 유틸리티
 *
 * 쿠키에 저장된 접근 토큰을 검증하여 해당 프로젝트에 대한 접근 권한이 있는지 확인.
 * 모든 프로젝트 데이터 변경(mutation) 서버 액션에서 호출해야 함.
 */

import { getAllAccessTokenCookies } from './cookies';
import { verifyProjectAccessToken } from './access-token';

/**
 * 프로젝트 ID 기반 접근 권한 확인
 *
 * 모든 프로젝트 접근 토큰 쿠키를 순회하며,
 * 유효한 토큰 중 해당 projectId에 대한 접근 권한이 있는지 검증.
 *
 * @param projectId - 접근 대상 프로젝트 ID
 * @returns 접근 가능 여부
 */
export async function requireProjectAccess(projectId: string): Promise<boolean> {
  try {
    const tokenMap = await getAllAccessTokenCookies();

    for (const [, token] of tokenMap) {
      const result = await verifyProjectAccessToken(token);
      if (result.valid && result.payload.projectId === projectId) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
