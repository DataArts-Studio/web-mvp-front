/**
 * 자동화 토큰 검증 미들웨어 (FDD-TR09 V1 청크 3).
 *
 * - 본 라우트(자동매핑 결과 수신) 전용 인증.
 * - `requireProjectAccess` 정식화는 V2 로 미루고, 본 함수는 토큰 hash 매칭만 담당.
 * - 매칭 성공 시 `last_used_at` 을 fire-and-forget 으로 갱신한다 (감사·미사용 토큰 탐지용).
 */
import { getDatabase, projectAutomationTokens, projects } from '@testea/db';
import { eq } from 'drizzle-orm';

import { hashAutomationToken, isValidTokenFormat } from './token';

export interface AutomationTokenAuth {
  projectId: string;
  tokenPrefix: string;
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

/**
 * Authorization 헤더의 Bearer 토큰을 검증해 해당 프로젝트 id 와 prefix 를 돌려준다.
 *
 * - 헤더 부재 / 형식 오류 / 매칭 실패 시 `null`.
 * - 토큰의 프로젝트가 보관·삭제(ACTIVE 아님) 상태면 `null`. 프로젝트를 닫은 뒤에도
 *   발급해 둔 토큰으로 결과를 계속 써 넣지 못하게 한다.
 * - 매칭 성공 시 `{ projectId, tokenPrefix }`.
 */
export async function verifyAutomationTokenFromRequest(
  request: Request
): Promise<AutomationTokenAuth | null> {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header) return null;

  const match = BEARER_PATTERN.exec(header.trim());
  if (!match) return null;

  const plaintext = match[1].trim();
  if (!isValidTokenFormat(plaintext)) return null;

  const hash = hashAutomationToken(plaintext);
  const db = getDatabase();
  const [row] = await db
    .select({
      project_id: projectAutomationTokens.project_id,
      token_prefix: projectAutomationTokens.token_prefix,
      project_status: projects.lifecycle_status,
    })
    .from(projectAutomationTokens)
    .innerJoin(projects, eq(projects.id, projectAutomationTokens.project_id))
    .where(eq(projectAutomationTokens.token_hash, hash))
    .limit(1);

  if (!row || row.project_status !== 'ACTIVE') return null;

  // last_used_at 갱신은 인증 결과에 영향 주지 않도록 fire-and-forget.
  // 실패해도 인증 자체는 통과한다.
  void db
    .update(projectAutomationTokens)
    .set({ last_used_at: new Date() })
    .where(eq(projectAutomationTokens.project_id, row.project_id))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[automation-token] last_used_at update failed', error);
    });

  return { projectId: row.project_id, tokenPrefix: row.token_prefix };
}
