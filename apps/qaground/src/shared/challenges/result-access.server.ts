import { createHmac, timingSafeEqual } from 'node:crypto';
import 'server-only';

const TOKEN_TTL_MS = 1000 * 60 * 30;

function secret(): string {
  const value =
    process.env.QAGROUND_RESULT_TOKEN_SECRET ??
    process.env.QAGROUND_MAGIC_SECRET ??
    process.env.QAGROUND_RUNNER_SECRET;

  if (value) return value;
  if (process.env.NODE_ENV !== 'production') return 'qaground-local-result-token-secret';
  throw new Error('QAGROUND_RESULT_TOKEN_SECRET is required in production.');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createChallengeResultToken(slug: string): string {
  const payload = Buffer.from(
    JSON.stringify({ slug, exp: Date.now() + TOKEN_TTL_MS }),
    'utf8'
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyChallengeResultToken(token: string | undefined, slug: string): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      slug?: unknown;
      exp?: unknown;
    };
    return parsed.slug === slug && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}
