import { getDatabase, projects } from '@testea/db';
import { eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import 'server-only';

import {
  type TokenVerifyResult,
  createProjectAccessToken,
  verifyProjectAccessToken,
} from './access-token';

function credentialVersion(projectId: string, identifierHash: string): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || !identifierHash) throw new Error('프로젝트 세션 설정이 유효하지 않습니다.');
  // 비밀번호 해시 자체나 오프라인 추측 가능한 단순 해시를 쿠키에 넣지 않는다.
  return createHmac('sha256', secret)
    .update(JSON.stringify(['project-credential-v1', projectId, identifierHash]))
    .digest('hex');
}

/** 로그인에서 실제 검증한 해시에 결합한다. 발급 중 비밀번호가 바뀌어도 이전 인증은 폐기된다. */
export async function createProjectSessionToken(
  projectId: string,
  projectName: string,
  identifierHash: string
): Promise<string> {
  return createProjectAccessToken(projectId, projectName, {
    credentialVersion: credentialVersion(projectId, identifierHash),
  });
}

/** 서명/만료뿐 아니라 매 요청의 DB 상태를 확인한다. 공유 캐시에 넣지 않는다. */
export async function verifyProjectSessionToken(token: string): Promise<TokenVerifyResult> {
  try {
    const result = await verifyProjectAccessToken(token);
    if (!result.valid) return result;
    const version = result.payload.credentialVersion;
    if (typeof version !== 'string' || !/^[a-f0-9]{64}$/.test(version)) {
      return { valid: false, error: 'TOKEN_INVALID' };
    }
    const [project] = await getDatabase()
      .select({ identifier: projects.identifier, status: projects.lifecycle_status })
      .from(projects)
      .where(eq(projects.id, result.payload.projectId))
      .limit(1);
    if (!project || project.status !== 'ACTIVE') return { valid: false, error: 'TOKEN_INVALID' };
    const expected = credentialVersion(result.payload.projectId, project.identifier);
    if (!timingSafeEqual(Buffer.from(version), Buffer.from(expected))) {
      return { valid: false, error: 'TOKEN_INVALID' };
    }
    return result;
  } catch {
    return { valid: false, error: 'TOKEN_INVALID' };
  }
}
