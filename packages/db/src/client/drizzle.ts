import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';

import * as tables from '../schema';
import * as relations from '../schema/relations';

/**
 * drizzle 스키마 객체. 런타임이 다른 환경(예: Cloudflare Workers + Hyperdrive)에서
 * 별도 드라이버로 drizzle 인스턴스를 만들 때 재사용한다.
 */
export const schema = { ...tables, ...relations };

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __TESTEA_DB__?: Database;
  __TESTEA_SQL__?: Sql;
};

let _db: Database | undefined = globalForDb.__TESTEA_DB__;
let _client: Sql | undefined = globalForDb.__TESTEA_SQL__;

/**
 * 외부에서 주입한 DB 인스턴스. postgres-js 직결이 불가능한 런타임
 * (Cloudflare Workers 등)에서 호환 드라이버로 만든 drizzle 을 주입한다.
 * 주입되면 getDatabase 가 이걸 우선 반환한다.
 */
let _injectedDb: Database | undefined;

/** 런타임용 DB 인스턴스를 주입/해제한다. undefined 전달 시 기본 경로로 복귀. */
export const setDatabase = (db: Database | undefined): void => {
  _injectedDb = db;
};

const getDatabaseUrl = () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error('SUPABASE_DB_URL is not set');
  return dbUrl;
};

const createClient = () => {
  if (_client) return _client;
  const databaseUrl = getDatabaseUrl();
  const isProd = process.env.NODE_ENV === 'production';

  // 인스턴스당 연결 수. 1 이면 한 인스턴스가 동시에 처리하는 요청의 모든 쿼리가 연결 하나에서
  // 줄을 선다(권한 확인·세션 대조로 액션당 쿼리가 늘어 화면에 액션 여러 개가 동시에 돌면 수 초
  // 대기). Supabase 트랜잭션 풀러(6543)를 쓰고 prepare 를 끄므로 여러 연결을 열어도 안전하다.
  // 전체 연결 수는 "실행 중 인스턴스 수 × max" 이므로 풀러 클라이언트 연결 한도 안에서 정한다.
  const client = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: 'require',
    prepare: false,
  });

  _client = client;
  if (!isProd) globalForDb.__TESTEA_SQL__ = client;
  return client;
};

export const getDatabase = (): Database => {
  if (_injectedDb) return _injectedDb;
  if (_db) return _db;
  const isProd = process.env.NODE_ENV === 'production';
  const client = createClient();
  const db = drizzle(client, {
    schema,
    logger: !isProd,
  });

  _db = db;
  if (!isProd) globalForDb.__TESTEA_DB__ = db;
  return db;
};

export const checkDatabaseHealth = async () => {
  const db = getDatabase();
  return await db.execute(sql`select 1 as health`);
};

export const closeDatabase = async () => {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = undefined;
    _db = undefined;
    globalForDb.__TESTEA_DB__ = undefined;
    globalForDb.__TESTEA_SQL__ = undefined;
  }
};
