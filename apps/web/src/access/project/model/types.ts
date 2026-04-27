/**
 * 프로젝트 접근 관련 타입 정의
 */

/**
 * 프로젝트 접근 검증 요청
 */
export interface VerifyProjectAccessRequest {
  projectName: string;
  password: string;
}

/**
 * 프로젝트 접근 검증 응답
 */
export type VerifyProjectAccessResponse =
  | { success: true; redirectUrl: string }
  | { success: false; error: string; remainingAttempts?: number };

/**
 * 프로젝트 접근 상태
 */
export interface ProjectAccessStatus {
  hasAccess: boolean;
  expiresAt?: number;
  projectName: string;
}

/**
 * 프로젝트 접근 폼 데이터
 */
export interface ProjectAccessFormData {
  password: string;
}

/**
 * 프로젝트 접근 정보 (DB에서 조회)
 */
export interface ProjectAccessInfo {
  id: string;
  name: string;
  /** 프로젝트 접근 비밀번호의 bcrypt 해시 */
  identifierHash: string;
}
