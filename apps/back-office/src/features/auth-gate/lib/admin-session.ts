import { adminSessions, getDatabase } from '@testea/db';
import { and, eq, gt } from 'drizzle-orm';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import 'server-only';

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function secretVersion(): string {
  const secret = process.env.BACKOFFICE_ADMIN_SECRET;
  if (!secret) throw new Error('관리자 인증 설정이 없습니다.');
  return createHmac('sha256', secret).update('backoffice-session-v1').digest('hex');
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const isSessionToken = (token: string | undefined): token is string =>
  typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

/** 공유키 검증 후에만 호출한다. 저장 실패 시 쿠키를 발급하지 않는다. */
export async function createAdminSession(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await getDatabase()
    .insert(adminSessions)
    .values({
      token_hash: tokenHash(token),
      secret_version: secretVersion(),
      expires_at: new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000),
    });
  return token;
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!isSessionToken(token)) return false;
  try {
    const hash = tokenHash(token);
    const version = secretVersion();
    const now = new Date();
    const [session] = await getDatabase()
      .select({
        tokenHash: adminSessions.token_hash,
        secretVersion: adminSessions.secret_version,
        expiresAt: adminSessions.expires_at,
      })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token_hash, hash),
          eq(adminSessions.secret_version, version),
          gt(adminSessions.expires_at, now)
        )
      )
      .limit(1);
    return (
      !!session &&
      session.tokenHash === hash &&
      session.secretVersion === version &&
      session.expiresAt.getTime() > now.getTime()
    );
  } catch {
    return false;
  }
}

/** DB에서 먼저 제거한다. 실패하면 로그아웃 성공으로 처리하지 않는다. */
export async function revokeAdminSession(token: string | undefined): Promise<void> {
  if (!isSessionToken(token)) return;
  await getDatabase()
    .delete(adminSessions)
    .where(eq(adminSessions.token_hash, tokenHash(token)));
}
