import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type Database, schema, setDatabase } from '@testea/db';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * Cloudflare Workers 런타임에서 DB 를 초기화해 주입한다.
 *
 * Cloudflare Hyperdrive 바인딩이 주는 커넥션 문자열로 postgres-js 클라이언트를 만들어
 * drizzle 을 구성하고 `setDatabase` 로 주입한다. Hyperdrive + nodejs_compat 조합에서는
 * postgres-js 가 Workers 에서도 동작하며, `@testea/db` 기본 드라이버와 동일해 일관적이다.
 * (node-postgres `pg` 는 Workers 번들 시 `pg-cloudflare` 해석 문제가 있어 사용하지 않는다.)
 *
 * Workers 가 아니거나(로컬 Node·다른 호스팅) HYPERDRIVE 바인딩이 없으면 아무 것도 하지
 * 않아 기본 postgres-js 경로를 그대로 사용한다. DB 를 쓰는 요청 진입부에서 호출한다.
 */
let injected = false;

export function initCloudflareDb(): void {
  if (injected) return;

  // wrangler.jsonc 의 HYPERDRIVE 바인딩. 정식 타입은 `wrangler types` 로 생성되지만,
  // 여기서는 바인딩 부재 환경(로컬·Vercel)도 안전하도록 직접 좁혀 읽는다.
  type HyperdriveEnv = { HYPERDRIVE?: { connectionString?: string } };
  let env: HyperdriveEnv | undefined;
  try {
    env = getCloudflareContext().env as unknown as HyperdriveEnv;
  } catch {
    // Cloudflare 컨텍스트 없음 → 기본 경로 사용
    return;
  }

  const connectionString = env?.HYPERDRIVE?.connectionString;
  if (!connectionString) return;

  // Hyperdrive 가 풀링·원본 TLS 를 담당한다. Workers 의 풀러 경유 연결이라
  // prepared statement 와 startup 타입 조회(fetch_types)는 비활성화한다.
  const client = postgres(connectionString, {
    max: 5,
    fetch_types: false,
    prepare: false,
  });
  setDatabase(drizzle(client, { schema }) as unknown as Database);
  injected = true;
}
