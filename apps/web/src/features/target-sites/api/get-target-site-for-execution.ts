import { CryptoError, decrypt } from '@/shared/lib/crypto';
import { getDatabase, targetSites } from '@testea/db';
import { and, eq } from 'drizzle-orm';
import 'server-only';

import type { TargetSiteAuthSecret, TargetSiteExecutionConfig } from '../model/types';

/**
 * 러너(#186) 실행용: base_url + 복호화된 인증 시크릿 반환.
 *
 * 서버 전용. 'use server' 파일이 아니므로 RSC action 으로 자동 노출되지 않고,
 * 'server-only' 가 클라이언트 import 를 빌드 단에서 차단한다. 같은 process 의
 * 서버 코드(Route Handler, server component)에서만 호출한다.
 *
 * 접근 가드: projectId 를 인자로 받아 해당 프로젝트 소유 row 만 반환한다.
 * 호출부(러너 라우트)는 프로젝트 API 키 인증(#186)으로 projectId 를 이미 검증한 뒤
 * 이 함수를 호출해야 한다(쿠키 기반 requireProjectAccess 는 서버↔서버 러너 경로에 없음).
 *
 * 복호화 실패(키 누락/형식 오류/인증 실패)는 CryptoError 로 전파해
 * 호출부가 운영 알림·재등록 안내 등으로 분기하게 한다.
 *
 * @returns 대상이 없거나 타 프로젝트 소유면 null.
 */
export const getTargetSiteForExecution = async (
  projectId: string,
  targetSiteId: string
): Promise<TargetSiteExecutionConfig | null> => {
  const db = getDatabase();

  const [row] = await db
    .select()
    .from(targetSites)
    .where(and(eq(targetSites.id, targetSiteId), eq(targetSites.project_id, projectId)))
    .limit(1);

  if (!row) return null;

  let auth: TargetSiteAuthSecret | null = null;
  if (row.auth_secret_encrypted != null) {
    try {
      auth = JSON.parse(decrypt(row.auth_secret_encrypted)) as TargetSiteAuthSecret;
    } catch (error) {
      // CryptoError 는 그대로 전파(키 불일치/손상 식별). JSON 파싱 오류도 데이터 무결성
      // 문제이므로 삼키지 않고 던진다.
      if (error instanceof CryptoError) throw error;
      throw error;
    }
  }

  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    baseUrl: row.base_url,
    auth,
  };
};
