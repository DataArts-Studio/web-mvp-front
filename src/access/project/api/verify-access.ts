'use server';

/**
 * 프로젝트 접근 검증 Server Action
 *
 * 비밀번호를 검증하고 접근 토큰을 발급.
 * 브루트포스 공격 방지를 위한 rate limiting 포함.
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDatabase, projects } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';

import { createProjectAccessToken } from '../../lib/access-token';
import { setAccessTokenCookie, deleteAccessTokenCookie } from '../../lib/cookies';
import { verifyPassword } from '../../lib/password-hash';
import type { ProjectAccessInfo, VerifyProjectAccessResponse } from '../model/types';
import { VerifyProjectAccessRequestSchema } from '../model/schema';

// 브루트포스 방지를 위한 인메모리 rate limiting (프로덕션에서는 Redis 권장)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15분

/**
 * Rate limiting 체크
 */
function checkRateLimit(key: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // 락아웃 시간이 지났으면 리셋
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

/**
 * 실패 횟수 기록
 */
function recordFailedAttempt(key: string): number {
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (!record || now - record.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.set(key, { count: 1, lastAttempt: now });
    return MAX_ATTEMPTS - 1;
  }

  record.count += 1;
  record.lastAttempt = now;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

/**
 * 성공 시 기록 삭제
 */
function clearFailedAttempts(key: string): void {
  failedAttempts.delete(key);
}

/**
 * 프로젝트 접근 정보 조회
 */
async function getProjectAccessInfo(projectName: string): Promise<ProjectAccessInfo | null> {
  const db = getDatabase();
  // URL 인코딩된 projectName을 디코딩
  const decodedName = decodeURIComponent(projectName);

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      identifier: projects.identifier,
    })
    .from(projects)
    .where(eq(projects.name, decodedName))
    .limit(1);

  if (!project) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    identifierHash: project.identifier,
  };
}

/**
 * 프로젝트 접근 검증 및 토큰 발급
 */
export async function verifyProjectAccess(
  projectName: string,
  password: string
): Promise<VerifyProjectAccessResponse> {
  try {
    // 1. 입력 검증
    const validation = VerifyProjectAccessRequestSchema.safeParse({ projectName, password });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || '입력값이 올바르지 않습니다.',
      };
    }

    // 2. Rate limiting 체크
    const rateLimitKey = `project:${projectName}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: '너무 많은 시도입니다. 15분 후에 다시 시도해주세요.',
        remainingAttempts: 0,
      };
    }

    // 3. 프로젝트 조회
    const project = await getProjectAccessInfo(projectName);
    if (!project) {
      // 프로젝트가 없어도 실패 횟수 기록 (정보 노출 방지)
      const remaining = recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        error: '프로젝트를 찾을 수 없거나 비밀번호가 일치하지 않습니다.',
        remainingAttempts: remaining,
      };
    }

    // 4. 비밀번호 검증
    const isValid = await verifyPassword(password, project.identifierHash);
    if (!isValid) {
      const remaining = recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        error: '비밀번호가 일치하지 않습니다.',
        remainingAttempts: remaining,
      };
    }

    // 5. 성공 - 토큰 발급 및 쿠키 설정
    clearFailedAttempts(rateLimitKey);

    const token = await createProjectAccessToken(project.id, project.name);
    await setAccessTokenCookie(project.name, token);

    // 캐시 갱신
    revalidatePath(`/projects/${project.name}`);

    return {
      success: true,
      redirectUrl: `/projects/${project.name}`,
    };
  } catch (error) {
    console.error('프로젝트 접근 검증 실패:', error);
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 프로젝트 접근 토큰 폐기 (로그아웃)
 */
export async function revokeProjectAccess(projectName: string): Promise<ActionResult<void>> {
  try {
    await deleteAccessTokenCookie(projectName);

    return {
      success: true,
      data: undefined,
      message: '프로젝트 접근 권한이 해제되었습니다.',
    };
  } catch (error) {
    console.error('접근 권한 해제 실패:', error);
    return {
      success: false,
      errors: { _form: ['접근 권한 해제에 실패했습니다.'] },
    };
  }
}

/**
 * 프로젝트 비밀번호 존재 여부 확인 (접근 제어 활성화 여부)
 */
export async function hasProjectPassword(projectName: string): Promise<boolean> {
  const project = await getProjectAccessInfo(projectName);
  if (!project) {
    return false;
  }

  return !!project.identifierHash;
}

/**
 * 프로젝트 존재 여부 확인
 */
export async function checkProjectExists(projectName: string): Promise<boolean> {
  try {
    const project = await getProjectAccessInfo(projectName);
    return project !== null;
  } catch (error) {
    console.error('프로젝트 존재 여부 확인 실패:', error);
    return false;
  }
}
