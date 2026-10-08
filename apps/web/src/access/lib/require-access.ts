/**
 * 서버 액션용 프로젝트 접근 권한 검증 유틸리티
 *
 * 쿠키에 저장된 접근 토큰을 검증하여 해당 프로젝트에 대한 접근 권한이 있는지 확인.
 * 모든 프로젝트 데이터 변경(mutation) 서버 액션에서 호출해야 함.
 */
import { verifyProjectAccessToken } from './access-token';
import { getAllAccessTokenCookies } from './cookies';
import { verifyProjectSessionToken } from './project-session';

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
      // 서명·만료만 먼저 확인해 대상 프로젝트 토큰일 때만 DB 로 폐기 여부를 대조한다.
      // 여러 프로젝트 쿠키를 가진 사용자가 요청마다 쿠키 수만큼 DB 를 조회하지 않게 한다.
      const basic = await verifyProjectAccessToken(token);
      if (!basic.valid || basic.payload.projectId !== projectId) continue;
      const result = await verifyProjectSessionToken(token);
      if (result.valid) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
