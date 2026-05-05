/**
 * 접근 제어 모듈 공개 API
 *
 * 사용 예시:
 * import { canAccessProject, verifyProjectAccess, AccessForm } from '@/access';
 */

// 정책 레이어
export {
  type AccessContext,
  type AccessPolicy,
  type AccessError,
  type ProjectAccessTokenPayload,
  ACCESS_ERROR_MESSAGES,
} from './policy';

export {
  canAccessProject,
  buildAccessContext,
  getAccessPolicy,
  getValidAccessToken,
} from './policy';

// 프로젝트 접근 제어
export {
  verifyProjectAccess,
  revokeProjectAccess,
  hasProjectPassword,
} from './project/api';

export {
  type VerifyProjectAccessRequest,
  type VerifyProjectAccessResponse,
  type ProjectAccessStatus,
  ProjectAccessFormSchema,
} from './project/model';

// UI 컴포넌트
export { AccessForm } from './project/ui';

// 라이브러리 (내부 사용, 필요 시 export)
export { hashPassword, verifyPassword } from './lib/password-hash';
export { createProjectAccessToken, verifyProjectAccessToken } from './lib/access-token';
export { requireProjectAccess } from './lib/require-access';
