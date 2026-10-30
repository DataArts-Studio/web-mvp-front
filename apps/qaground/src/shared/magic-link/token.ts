/**
 * qaground 베타 매직링크 토큰 (HMAC-SHA256 JWT).
 *
 * apps/web 의 access-token(`src/access/lib/access-token.ts`) 패턴을 그대로 따르되,
 * 페이로드를 이메일 기반으로 한다. 계정(social-login) 정식 도입 전, 베타 신청자가
 * 이메일로 받은 일회용 링크로만 진입(소유 증명)하도록 하는 용도.
 *
 * 시크릿은 `QAGROUND_MAGIC_SECRET`(apps/qaground/.env.local) 필요.
 */

const TOKEN_TYPE = 'qaground_beta' as const;
/** 매직링크 기본 만료: 30분 (단기·일회성. 엄격한 일회용 used 추적은 후속). */
const DEFAULT_EXPIRES_IN = 30 * 60;

export type MagicTokenPayload = {
  type: typeof TOKEN_TYPE;
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
}

async function createSignature(data: string, secret: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return base64ToBase64Url(createHmac('sha256', secret).update(data).digest('base64'));
}

async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  const { timingSafeEqual } = await import('crypto');
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getSecret(): string {
  const secret = process.env.QAGROUND_MAGIC_SECRET;
  if (!secret) {
    throw new Error(
      'QAGROUND_MAGIC_SECRET environment variable is required. ' +
        'Set it in apps/qaground/.env.local for development.'
    );
  }
  return secret;
}

/** 이메일 기반 매직링크 토큰 발급. */
export async function createMagicToken(
  email: string,
  expiresIn: number = DEFAULT_EXPIRES_IN
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: MagicTokenPayload = {
    type: TOKEN_TYPE,
    email,
    issuedAt: now,
    expiresAt: now + expiresIn,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await createSignature(`${header}.${body}`, getSecret());
  return `${header}.${body}.${signature}`;
}

export type MagicVerifyResult =
  | { valid: true; email: string }
  | { valid: false; error: 'INVALID' | 'EXPIRED' };

/** 매직링크 토큰 검증 (서명·타입·만료). */
export async function verifyMagicToken(token: string): Promise<MagicVerifyResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'INVALID' };

    const [header, body, signature] = parts;
    const expected = await createSignature(`${header}.${body}`, getSecret());
    if (!(await timingSafeStringEqual(signature, expected))) {
      return { valid: false, error: 'INVALID' };
    }

    const payload = JSON.parse(base64UrlDecode(body)) as MagicTokenPayload;
    if (payload.type !== TOKEN_TYPE) return { valid: false, error: 'INVALID' };

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) return { valid: false, error: 'EXPIRED' };

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false, error: 'INVALID' };
  }
}
