import { GoogleAuth, type IdTokenClient } from 'google-auth-library';
import 'server-only';

/**
 * IAM 으로 보호된 Cloud Run 러너를 호출하기 위한 Google ID 토큰 발급기.
 *
 * Vercel(GCP 밖)은 메타데이터 서버가 없으므로, 전용 invoker SA 자격증명으로
 * audience(=러너 URL) 고정 ID 토큰을 만들어 Authorization: Bearer 로 싣는다.
 *
 * 자격증명은 env(QAGROUND_RUNNER_INVOKER_SA_KEY)로 주입한다 (절대 레포에 두지 않는다):
 * - SA 키 JSON 원문, 그 base64, 또는 Workload Identity Federation external_account
 *   JSON. GoogleAuth 가 타입을 자동 판별하므로 코드 변경 없이 WIF(키리스) 전환 가능.
 *
 * 자격증명 env 가 없으면 null → 호출부는 Authorization 헤더를 생략(로컬 비IAM 러너 호환).
 */

let cached: { audience: string; client: IdTokenClient } | null = null;
let cachedToken: { audience: string; value: string; expMs: number } | null = null;

function parseCredentials(raw: string): Record<string, unknown> {
  const text = raw.trim();
  const candidate = text.startsWith('{') ? text : Buffer.from(text, 'base64').toString('utf8');
  return JSON.parse(candidate) as Record<string, unknown>;
}

function decodeExpMs(jwt: string): number {
  try {
    const payload = jwt.split('.')[1];
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as { exp?: number };
    if (typeof json.exp === 'number') return json.exp * 1000;
  } catch {
    // 무시: 아래 기본값
  }
  return Date.now() + 5 * 60_000;
}

/**
 * 러너 호출용 Authorization 헤더 값(`Bearer <id_token>`). 자격증명 미설정이면 null.
 *
 * @param audience 러너 베이스 URL. Cloud Run 서비스 URL 과 정확히 일치해야 한다.
 * @param credentialsRaw invoker SA 키(JSON/base64) 또는 WIF 자격증명.
 */
export async function getRunnerAuthHeader(
  audience: string,
  credentialsRaw: string | undefined
): Promise<string | null> {
  if (!credentialsRaw || credentialsRaw.trim().length === 0) return null;

  if (cachedToken && cachedToken.audience === audience && cachedToken.expMs - 60_000 > Date.now()) {
    return `Bearer ${cachedToken.value}`;
  }

  if (!cached || cached.audience !== audience) {
    const credentials = parseCredentials(credentialsRaw);
    const auth = new GoogleAuth({ credentials });
    cached = { audience, client: await auth.getIdTokenClient(audience) };
  }

  const token = await cached.client.idTokenProvider.fetchIdToken(audience);
  cachedToken = { audience, value: token, expMs: decodeExpMs(token) };
  return `Bearer ${token}`;
}
