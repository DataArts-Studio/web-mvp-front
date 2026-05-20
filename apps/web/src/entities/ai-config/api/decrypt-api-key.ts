import { CryptoError, decrypt } from '@/shared/lib/crypto';
import { getDatabase, projectAiConfigs } from '@testea/db';
import { and, eq } from 'drizzle-orm';
import 'server-only';

import { AiError } from '../model/ai-error';

/**
 * AI 설정에서 복호화된 API 키를 조회한다.
 *
 * 'use server' 파일이 아니므로 RSC action 으로 자동 노출되지 않는다.
 * 호출은 같은 process 의 서버 코드(Route Handler, server component)에서만 허용된다.
 * 클라이언트에서 import 하면 'server-only' 가 빌드 단에서 차단한다.
 *
 * 복호화 실패(키 env 누락/형식 오류/인증 실패) 는 도메인 에러로 승격해
 * 호출부(route handler)가 의미 있는 상태코드·메시지로 응답하도록 한다.
 */
export const getDecryptedApiKey = async (
  projectId: string
): Promise<{ provider: string; apiKey: string; model: string | null } | null> => {
  const db = getDatabase();

  const [config] = await db
    .select()
    .from(projectAiConfigs)
    .where(
      and(
        eq(projectAiConfigs.project_id, projectId),
        eq(projectAiConfigs.lifecycle_status, 'ACTIVE')
      )
    )
    .limit(1);

  if (!config) return null;

  try {
    return {
      provider: config.provider,
      apiKey: decrypt(config.api_key),
      model: config.model,
    };
  } catch (error) {
    if (error instanceof CryptoError) throw AiError.fromCryptoError(error);
    throw error;
  }
};
