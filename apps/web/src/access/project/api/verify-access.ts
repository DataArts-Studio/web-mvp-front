'use server';

/**
 * 프로젝트 접근 검증 Server Action
 *
 * 비밀번호를 검증하고 접근 토큰을 발급.
 * 브루트포스 공격 방지를 위한 rate limiting 포함.
 */
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { verifyTurnstileToken } from '@/shared/lib/turnstile';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, projects } from '@testea/db';
import { eq } from 'drizzle-orm';

import { createProjectAccessToken } from '../../lib/access-token';
import { deleteAccessTokenCookie, setAccessTokenCookie } from '../../lib/cookies';
import { verifyPassword } from '../../lib/password-hash';
import { VerifyProjectAccessRequestSchema } from '../model/schema';
import type { ProjectAccessInfo, VerifyProjectAccessResponse } from '../model/types';

/**
 * 브루트포스 방지를 위한 인메모리 rate limiting
 *
 * ⚠️ TODO [프로덕션 전 필수]: Redis 기반으로 전환 필요
 * - 현재 인메모리 Map은 서버 재시작 시 초기화됨
 * - 멀티 인스턴스 배포 시 인스턴스별로 독립 카운팅되어 무력화됨
 * - 베타 단계(단일 인스턴스)에서만 유효
 */
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
 * 신뢰 가능한 클라이언트 IP 추출 (rate limit 키용).
 * x-forwarded-for 의 좌측 값은 클라이언트가 헤더로 조작 가능하므로 신뢰하지 않는다
 * (헤더 회전으로 락아웃 우회 방지). 플랫폼이 설정하는 x-real-ip 를 우선하고,
 * 없으면 XFF 의 우측(가장 가까운 신뢰 hop)을 사용한다.
 */
function getClientIp(headerStore: { get(name: string): string | null }): string {
  const realIp = headerStore.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = headerStore.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
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
  password: string,
  turnstileToken?: string
): Promise<VerifyProjectAccessResponse> {
  try {
    // 0. Turnstile 봇 검증: production 환경에서는 토큰 없이 호출하는 경로 자체를 차단한다.
    // dev/preview 는 클라이언트가 siteKey 미설정 시 토큰 없이 제출하도록 설계되어 있어
    // 같은 가드를 적용하면 개발 흐름이 회귀한다. 토큰이 들어오면 환경 무관 검증은 그대로 수행.
    const isProduction = process.env.VERCEL_ENV === 'production';
    if (isProduction && !turnstileToken) {
      return {
        success: false,
        error: '보안 검증 토큰이 없습니다. 페이지를 새로고침 후 다시 시도해주세요.',
      };
    }
    if (turnstileToken) {
      const isHuman = await verifyTurnstileToken(turnstileToken);
      if (!isHuman) {
        return {
          success: false,
          error: '보안 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.',
        };
      }
    }

    // 1. 입력 검증
    const validation = VerifyProjectAccessRequestSchema.safeParse({ projectName, password });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || '입력값이 올바르지 않습니다.',
      };
    }

    // 2. Rate limiting 체크 (프로젝트 + IP 기반)
    const headerStore = await headers();
    const clientIp = getClientIp(headerStore);
    const rateLimitKey = `project:${projectName}:ip:${clientIp}`;
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
    Sentry.captureException(error, { extra: { action: 'verifyProjectAccess' } });
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
    Sentry.captureException(error, { extra: { action: 'revokeProjectAccess' } });
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
    Sentry.captureException(error, { extra: { action: 'checkProjectExists' } });
    return false;
  }
}
