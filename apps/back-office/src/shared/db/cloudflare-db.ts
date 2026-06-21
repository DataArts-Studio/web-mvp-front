import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type Database, schema, setDatabase } from '@testea/db';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * Cloudflare Workers 런타임에서 DB 를 초기화해 주입한다.
 *
 * 배포 시 주입한 `SUPABASE_DB_URL` 시크릿(해당 환경의 Supabase 연결 문자열)으로
 * postgres-js 클라이언트를 만들어 drizzle 을 구성하고 `setDatabase` 로 주입한다.
 * Hyperdrive 를 거치지 않고 nodejs_compat 위에서 Supabase 에 직접 연결한다
 * (백오피스는 관리자 전용 저트래픽이라 엣지 풀링 없이도 충분). 서버리스 특성상
 * 트랜잭션 풀러(Supavisor) 연결 문자열 + prepared statement 비활성을 전제로 한다.
 *
 * Workers 가 아니거나(로컬 Node·다른 호스팅) 시크릿이 없으면 아무 것도 하지 않아
 * `@testea/db` 기본 경로(process.env.SUPABASE_DB_URL)를 그대로 쓴다. DB 를 쓰는
 * 요청 진입부에서 호출한다.
 */
let injected = false;

export function initCloudflareDb(): void {
  if (injected) return;

  // 워커 바인딩(시크릿)을 읽는다. 바인딩 부재 환경(로컬·Vercel)도 안전하도록 좁혀 읽는다.
  type CfEnv = { SUPABASE_DB_URL?: string };
  let env: CfEnv | undefined;
  try {
    env = getCloudflareContext().env as unknown as CfEnv;
  } catch {
    // Cloudflare 컨텍스트 없음 → 기본 경로 사용
    return;
  }

  const connectionString = env?.SUPABASE_DB_URL;
  if (!connectionString) return;

  // Supabase 트랜잭션 풀러 경유 + Workers 직결이라 prepared statement·startup 타입 조회는
  // 비활성하고, 연결은 SSL 필수.
  const client = postgres(connectionString, {
    max: 5,
    ssl: 'require',
    prepare: false,
    fetch_types: false,
  });
  setDatabase(drizzle(client, { schema }) as unknown as Database);
  injected = true;
}
