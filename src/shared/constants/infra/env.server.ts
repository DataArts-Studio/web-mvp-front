import 'server-only';

/* ────────────────────────────────────────
 * 서버 전용 환경 변수
 * 절대 클라이언트로 노출되면 안 됨
 * ────────────────────────────────────────*/
export const SERVER_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
};
