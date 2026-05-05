import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as tables from '../schema';
import * as relations from '../schema/relations';

const schema = { ...tables, ...relations };

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __TESTEA_DB__?: Database;
  __TESTEA_SQL__?: Sql;
};

let _db: Database | undefined = globalForDb.__TESTEA_DB__;
let _client: Sql | undefined = globalForDb.__TESTEA_SQL__;

const getDatabaseUrl = () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error('SUPABASE_DB_URL is not set');
  return dbUrl;
}

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
}

export const getDatabase = (): Database => {
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
}

export const checkDatabaseHealth = async () => {
  const db = getDatabase();
  return await db.execute(sql`select 1 as health`);
}

export const closeDatabase = async () => {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = undefined;
    _db = undefined;
    globalForDb.__TESTEA_DB__ = undefined;
    globalForDb.__TESTEA_SQL__ = undefined;
  }
}
