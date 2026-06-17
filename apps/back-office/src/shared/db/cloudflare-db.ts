import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type Database, schema, setDatabase } from '@testea/db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Cloudflare Workers 런타임에서 DB 를 초기화해 주입한다.
 *
 * Workers 에서는 외부 Postgres 로 직접 TCP 를 열 수 없으므로 postgres-js 직결
 * (`@testea/db` 기본 경로)이 동작하지 않는다. 대신 Cloudflare Hyperdrive 바인딩이 주는
 * 커넥션 문자열로 node-postgres 풀을 만들어 drizzle 을 구성하고 `setDatabase` 로 주입한다.
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

  // Hyperdrive 가 커넥션 풀링을 담당하므로 워커 측 풀은 커넥션을 재사용하지 않는다.
  const pool = new Pool({ connectionString, maxUses: 1 });
  setDatabase(drizzle(pool, { schema }) as unknown as Database);
  injected = true;
}
