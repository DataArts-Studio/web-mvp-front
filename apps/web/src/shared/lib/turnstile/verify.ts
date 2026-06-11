'use server';

import * as Sentry from '@sentry/nextjs';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Cloudflare Turnstile 토큰을 서버 측에서 검증합니다.
 *
 * - 개발 환경에서 secret key 미설정 시 검증을 건너뜁니다.
 * - Turnstile 서비스 장애 시 graceful degradation (통과 허용)
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      // 운영에선 시크릿 미설정 시 fail-closed (봇 검증 우회 금지). dev/preview 만 통과.
      if (process.env.VERCEL_ENV === 'production') {
        Sentry.captureMessage('CLOUDFLARE_TURNSTILE_SECRET_KEY is not set in production', {
          level: 'error',
        });
        return false;
      }
      return true;
    }

    if (!token) return false;

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'verifyTurnstileToken' } });
    // 운영에선 검증 실패 시 fail-closed; dev/preview 만 graceful degradation 통과.
    return process.env.VERCEL_ENV !== 'production';
  }
}
