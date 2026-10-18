'use server';

/**
 * 프로젝트 접근 검증 Server Action
 *
 * 비밀번호를 검증하고 접근 토큰을 발급.
 * 브루트포스 공격 방지를 위한 rate limiting 포함.
 */
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { clearRateLimit, consumeRateLimit, getClientIp } from '@/shared/lib/rate-limit';
import { verifyTurnstileToken } from '@/shared/lib/turnstile';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';

import { deleteAccessTokenCookie, setAccessTokenCookie } from '../../lib/cookies';
import { verifyPassword } from '../../lib/password-hash';
import { createProjectSessionToken } from '../../lib/project-session';
import { VerifyProjectAccessRequestSchema } from '../model/schema';
import type { VerifyProjectAccessResponse } from '../model/types';
import { getProjectAccessInfo } from './project-lookup';

/**
 * 브루트포스 방지: 프로젝트 + IP 기준으로 실패를 센다.
 * 카운터는 DB(rate_limit_buckets)에 있어 서버리스 인스턴스와 무관하게 유지된다 (#471).
 * 마지막 시도부터 LOCKOUT_DURATION 동안 기억하고, MAX_ATTEMPTS 를 넘기면 잠근다.
 */
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15분

/** 잠금 안내 문구. 몇 분 뒤에 다시 시도할 수 있는지 함께 알려 준다 (#406). */
function lockoutMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `비밀번호를 ${MAX_ATTEMPTS}회 잘못 입력해 접근이 잠겼습니다. ${minutes}분 후에 다시 시도해주세요.`;
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

    // 2. Rate limiting (프로젝트 + IP 기반). 검증 전에 먼저 한 번 세어, 동시에 보낸 요청도
    // 잠금 횟수를 넘지 못하게 한다. 맞히면 아래에서 기록을 지운다.
    const headerStore = await headers();
    const clientIp = getClientIp(headerStore);
    const rateLimitKey = `verify-access:project:${projectName}:ip:${clientIp}`;
    const attempt = await consumeRateLimit(rateLimitKey, {
      limit: MAX_ATTEMPTS,
      windowMs: LOCKOUT_DURATION,
      sliding: true,
    });
    if (!attempt.allowed) {
      return {
        success: false,
        error: lockoutMessage(attempt.retryAfterMs),
        remainingAttempts: 0,
      };
    }
    const remaining = MAX_ATTEMPTS - attempt.count;

    // 3. 프로젝트 조회
    const project = await getProjectAccessInfo(projectName);
    if (!project) {
      // 프로젝트가 없어도 실패로 센다 (정보 노출 방지)
      return {
        success: false,
        // 이번 실패로 잠겼으면 다음 시도가 아니라 지금 바로 잠금을 알린다 (#406).
        error:
          remaining === 0
            ? lockoutMessage(attempt.retryAfterMs)
            : '프로젝트를 찾을 수 없거나 비밀번호가 일치하지 않습니다.',
        remainingAttempts: remaining,
      };
    }

    // 4. 비밀번호 검증
    const isValid = await verifyPassword(password, project.identifierHash);
    if (!isValid) {
      return {
        success: false,
        error:
          remaining === 0 ? lockoutMessage(attempt.retryAfterMs) : '비밀번호가 일치하지 않습니다.',
        remainingAttempts: remaining,
      };
    }

    // 5. 성공 - 토큰 발급 및 쿠키 설정
    await clearRateLimit(rateLimitKey);

    const token = await createProjectSessionToken(project.id, project.name, project.identifierHash);
    await setAccessTokenCookie(project.name, token);

    // 캐시 갱신
    revalidatePath(`/projects/${encodeURIComponent(project.name)}`);

    return {
      success: true,
      redirectUrl: `/projects/${encodeURIComponent(project.name)}`,
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
