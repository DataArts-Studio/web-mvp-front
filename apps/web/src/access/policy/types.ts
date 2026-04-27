/**
 * 접근 제어 정책 타입 정의
 *
 * User Authentication과 Resource Access Control을 분리하여 설계.
 * 두 시스템이 독립적으로 동작하며, 동시에 적용 가능.
 */

/**
 * 사용자 세션 (추후 User Auth 구현 시 사용)
 */
export interface UserSession {
  userId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  expiresAt: number;
}

/**
 * 프로젝트 접근 토큰 페이로드
 */
export interface ProjectAccessTokenPayload {
  type: 'project_access';
  projectId: string;
  projectName: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * 접근 컨텍스트
 * 현재 요청의 인증/인가 상태를 담는 컨테이너
 */
export interface AccessContext {
  /** 프로젝트 접근 토큰 (Resource Access) */
  projectAccessToken?: ProjectAccessTokenPayload;

  /** 사용자 세션 (User Auth - 추후 구현) */
  userSession?: UserSession;
}

/**
 * 접근 정책 인터페이스
 * 모든 접근 정책 판단은 이 인터페이스를 통해 수행
 */
export interface AccessPolicy {
  /**
   * 프로젝트 접근 가능 여부 판단
   * @param projectId - 프로젝트 ID
   * @param context - 접근 컨텍스트
   * @returns 접근 가능 여부
   */
  canAccessProject(projectId: string, context: AccessContext): Promise<boolean>;

  /**
   * 프로젝트 이름으로 접근 가능 여부 판단
   * @param projectName - 프로젝트 이름
   * @param context - 접근 컨텍스트
   * @returns 접근 가능 여부
   */
  canAccessProjectByName(projectName: string, context: AccessContext): Promise<boolean>;
}

/**
 * 접근 검증 결과
 */
export type AccessVerificationResult =
  | { success: true; token: string }
  | { success: false; error: AccessError };

/**
 * 접근 에러 타입
 */
export type AccessError =
  | 'INVALID_PASSWORD'
  | 'PROJECT_NOT_FOUND'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/**
 * 접근 에러 메시지 매핑
 */
export const ACCESS_ERROR_MESSAGES: Record<AccessError, string> = {
  INVALID_PASSWORD: '비밀번호가 일치하지 않습니다.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  TOKEN_EXPIRED: '접근 권한이 만료되었습니다. 다시 인증해주세요.',
  TOKEN_INVALID: '유효하지 않은 접근 권한입니다.',
  RATE_LIMITED: '너무 많은 시도입니다. 잠시 후 다시 시도해주세요.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다.',
};

/**
 * 접근 토큰 설정
 */
export interface AccessTokenConfig {
  /** 토큰 만료 시간 (초) - 기본 24시간 */
  expiresIn: number;
  /** 쿠키 이름 접두사 */
  cookiePrefix: string;
  /** Secure 플래그 (production에서만 true) */
  secure: boolean;
}

/**
 * 기본 토큰 설정
 */
export const DEFAULT_ACCESS_TOKEN_CONFIG: AccessTokenConfig = {
  expiresIn: 24 * 60 * 60, // 24시간
  cookiePrefix: 'project_access',
  secure: process.env.NODE_ENV === 'production',
};
