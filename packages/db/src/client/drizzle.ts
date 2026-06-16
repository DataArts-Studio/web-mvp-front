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

  const client = postgres(databaseUrl, {
    max: 1,
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
