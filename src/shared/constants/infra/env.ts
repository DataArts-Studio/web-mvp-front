/* ────────────────────────────────────────
 * 브라우저에서 접근 가능한 환경 변수 (NEXT_PUBLIC)
 * ────────────────────────────────────────*/
const CLIENT = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  ENABLE_MOCK: process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true',
  GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID ?? '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;

/* ────────────────────────────────────────
 * 환경 기반 앱 설정값
 * ────────────────────────────────────────*/
const CONFIG = {
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  API_TIMEOUT: process.env.NODE_ENV === 'development' ? 5000 : 15000,

  // MVP 제한(나중에 확장 가능)
  LIMIT: {
    MAX_PROJECT: 5,
    MAX_MILESTONE_PER_PROJECT: 10,
  },
} as const;

export const ENV = {
  CLIENT,
  CONFIG,
} as const;
