/**
 * 테스트 대상(target site) 도메인 타입.
 *
 * 인증 시크릿 평문(`TargetSiteAuthSecret`)은 서버 내부와 러너 주입 경로에서만 다룬다.
 * 클라이언트로 내려가는 조회 타입(`TargetSite`)에는 시크릿 평문이 절대 포함되지 않고,
 * 존재 여부(`hasAuth`)만 노출한다.
 */

/**
 * 로그인 인증 정보의 유연한 구조. DB 에는 이 객체를 JSON 직렬화 후 AES-256-GCM 으로
 * 암호화해 `target_sites.auth_secret_encrypted` 에 저장한다. 평문 저장 금지.
 * 모든 필드 optional: 대상마다 필요한 인증 수단이 다르다(폼 로그인/헤더/쿠키 등).
 */
export type TargetSiteAuthSecret = {
  /** 폼 로그인 사용자명. */
  username?: string;
  /** 폼 로그인 비밀번호. */
  password?: string;
  /** 요청에 주입할 커스텀 헤더 (예: Authorization, x-api-key). */
  headers?: Record<string, string>;
  /** 주입할 쿠키 (name → value). */
  cookies?: Record<string, string>;
};

/**
 * 클라이언트로 노출되는 테스트 대상. 시크릿 평문 없음.
 * `hasAuth` 로 인증 정보 등록 여부만 표시한다.
 */
export type TargetSite = {
  id: string;
  projectId: string;
  name: string;
  baseUrl: string;
  /** 인증 시크릿이 등록되어 있는지 여부. 평문은 노출하지 않는다. */
  hasAuth: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * 러너(#186) 주입용. base_url + 복호화된 인증 시크릿.
 * 서버 전용 경로(getTargetSiteForExecution)에서만 생성·반환된다.
 */
export type TargetSiteExecutionConfig = {
  id: string;
  projectId: string;
  name: string;
  baseUrl: string;
  /** 복호화된 인증 정보. 등록 안 된 대상은 null. */
  auth: TargetSiteAuthSecret | null;
};
